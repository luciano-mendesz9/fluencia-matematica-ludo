import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@/src/generated/prisma/client";
import type { GlobalRole, SchoolMembershipRole, UserStatus } from "@/src/generated/prisma/enums";
import { prisma } from "@/src/lib/prisma";
import { AuthorizationError } from "@/src/server/auth/errors";
import { normalizeIdentifier } from "@/src/server/auth/normalization";
import { hashPassword } from "@/src/server/auth/password";
import { newPasswordSchema } from "@/src/server/auth/password-policy";
import { assertGlobalRole, type AuthenticatedPrincipal } from "@/src/server/auth/policies";

type DatabaseClient = typeof prisma | Prisma.TransactionClient;

const assignmentSelect = {
  id: true,
  teacherId: true,
  schoolId: true,
  classId: true,
  status: true,
  startsAt: true,
  endsAt: true,
  revision: true,
  classGroup: {
    select: { name: true, grade: true, academicYear: { select: { year: true } } },
  },
} as const;

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function cleanName(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ");
}

function validateName(name: string) {
  if (name.length < 2 || name.length > 160) {
    throw new AuthorizationError("VALIDATION", "Informe o nome da pessoa com 2 a 160 caracteres.");
  }
}

function validateRevision(revision: number) {
  if (!Number.isInteger(revision) || revision < 1) {
    throw new AuthorizationError("VALIDATION", "Revisão inválida.");
  }
}

function isPrismaCode(error: unknown, code: string) {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

function safeEnd(startsAt: Date, requested = new Date()) {
  return requested > startsAt ? requested : new Date(startsAt.getTime() + 1);
}

function adultEmail(value: string) {
  const normalized = normalizeIdentifier(value);
  if (normalized.kind !== "adult") {
    throw new AuthorizationError("VALIDATION", "Informe um e-mail adulto válido.");
  }
  return normalized.value;
}

async function authorizeSchoolPeopleManager(
  client: DatabaseClient,
  actor: AuthenticatedPrincipal,
  schoolId: string,
  options: { requireActiveSchool?: boolean } = {},
) {
  if (!isUuid(schoolId)) throw new AuthorizationError("VALIDATION", "Escola inválida.");
  const school = await client.school.findUnique({
    where: { id: schoolId },
    select: { id: true, name: true, status: true },
  });
  if (!school) throw new AuthorizationError("NOT_FOUND", "Escola não encontrada.");
  if (options.requireActiveSchool && school.status !== "ACTIVE") {
    throw new AuthorizationError("STATE_CONFLICT", "A escola precisa estar ativa para receber vínculos.");
  }
  if (actor.globalRole === "SEMED_ADMIN") return { school, managerRole: "SEMED_ADMIN" as const };
  if (actor.globalRole || actor.studentCode) throw new AuthorizationError("FORBIDDEN", "Acesso não autorizado.");
  const now = new Date();
  const membership = await client.schoolMembership.findFirst({
    where: {
      userId: actor.id,
      schoolId,
      role: "COORDINATOR",
      status: "ACTIVE",
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      school: { status: "ACTIVE" },
    },
    select: { id: true },
  });
  if (!membership) throw new AuthorizationError("FORBIDDEN", "Vínculo escolar não autorizado.");
  return { school, managerRole: "COORDINATOR" as const };
}

function assertLocalRoleAllowed(managerRole: "SEMED_ADMIN" | "COORDINATOR", role: SchoolMembershipRole) {
  if (managerRole === "COORDINATOR" && role !== "TEACHER") {
    throw new AuthorizationError("FORBIDDEN", "Coordenadores só podem gerenciar professores da própria escola.");
  }
}

function mapWriteError(error: unknown, duplicateMessage: string): never {
  if (error instanceof AuthorizationError) throw error;
  if (isPrismaCode(error, "P2002")) throw new AuthorizationError("STATE_CONFLICT", duplicateMessage);
  if (isPrismaCode(error, "P2034")) {
    throw new AuthorizationError("STATE_CONFLICT", "Os dados foram alterados por outra operação. Atualize a página e tente novamente.");
  }
  throw error;
}

export async function listGlobalAdults(actor: AuthenticatedPrincipal) {
  assertGlobalRole(actor, ["SEMED_ADMIN"]);
  return prisma.user.findMany({
    where: { globalRole: { not: null }, studentCode: null },
    select: { id: true, name: true, email: true, globalRole: true, status: true, revision: true },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
}

export async function createGlobalAdult(input: {
  actor: AuthenticatedPrincipal;
  name: string;
  email: string;
  temporaryPassword: string;
  globalRole: GlobalRole;
  correlationId?: string;
}) {
  assertGlobalRole(input.actor, ["SEMED_ADMIN"]);
  const name = cleanName(input.name);
  validateName(name);
  const email = adultEmail(input.email);
  const password = newPasswordSchema.safeParse(input.temporaryPassword);
  if (!password.success) throw new AuthorizationError("VALIDATION", password.error.issues[0]?.message ?? "Senha temporária inválida.");
  const passwordHash = await hashPassword(password.data);
  try {
    return await prisma.$transaction(async (transaction) => {
      const adult = await transaction.user.create({
        data: { name, email, normalizedEmail: email, passwordHash, globalRole: input.globalRole },
        select: { id: true, name: true, email: true, globalRole: true, status: true, revision: true },
      });
      await transaction.auditEvent.create({
        data: {
          actorId: input.actor.id,
          action: "GLOBAL_ADULT_CREATED",
          targetType: "User",
          targetId: adult.id,
          correlationId: input.correlationId ?? randomUUID(),
          after: { name: adult.name, globalRole: adult.globalRole, status: adult.status },
        },
      });
      return adult;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    mapWriteError(error, "Já existe uma conta com este e-mail.");
  }
}

export async function updateGlobalAdultStatus(input: {
  actor: AuthenticatedPrincipal;
  userId: string;
  status: UserStatus;
  revision: number;
  correlationId?: string;
}) {
  assertGlobalRole(input.actor, ["SEMED_ADMIN"]);
  validateRevision(input.revision);
  if (!isUuid(input.userId)) throw new AuthorizationError("NOT_FOUND", "Conta não encontrada.");
  try {
    return await prisma.$transaction(async (transaction) => {
      const before = await transaction.user.findFirst({
        where: { id: input.userId, studentCode: null, globalRole: { not: null } },
        select: { id: true, name: true, globalRole: true, status: true, revision: true, sessionVersion: true },
      });
      if (!before) throw new AuthorizationError("NOT_FOUND", "Conta global não encontrada.");
      if (input.status === "BLOCKED" && before.globalRole === "SEMED_ADMIN" && before.status === "ACTIVE") {
        const activeAdmins = await transaction.user.count({ where: { globalRole: "SEMED_ADMIN", status: "ACTIVE" } });
        if (activeAdmins <= 1) throw new AuthorizationError("STATE_CONFLICT", "O último administrador municipal ativo não pode ser bloqueado.");
      }
      const changed = await transaction.user.updateMany({
        where: { id: before.id, revision: input.revision },
        data: {
          status: input.status,
          revision: { increment: 1 },
          ...(input.status === "BLOCKED" ? { sessionVersion: { increment: 1 } } : {}),
        },
      });
      if (changed.count !== 1) throw new AuthorizationError("STATE_CONFLICT", "A conta foi alterada por outra operação.");
      if (input.status === "BLOCKED") {
        await transaction.session.updateMany({ where: { userId: before.id, revokedAt: null }, data: { revokedAt: new Date() } });
      }
      const after = await transaction.user.findUniqueOrThrow({
        where: { id: before.id },
        select: { id: true, name: true, globalRole: true, status: true, revision: true },
      });
      await transaction.auditEvent.create({
        data: {
          actorId: input.actor.id,
          action: "GLOBAL_ADULT_STATUS_UPDATED",
          targetType: "User",
          targetId: after.id,
          correlationId: input.correlationId ?? randomUUID(),
          before: { globalRole: before.globalRole, status: before.status, revision: before.revision },
          after: { globalRole: after.globalRole, status: after.status, revision: after.revision },
        },
      });
      return after;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    mapWriteError(error, "Já existe uma conta com estes dados.");
  }
}

export async function listSchoolAdults(input: { actor: AuthenticatedPrincipal; schoolId: string }) {
  await authorizeSchoolPeopleManager(prisma, input.actor, input.schoolId);
  const now = new Date();
  const memberships = await prisma.schoolMembership.findMany({
    where: { schoolId: input.schoolId },
    select: {
      id: true,
      role: true,
      status: true,
      startsAt: true,
      endsAt: true,
      revision: true,
      user: { select: { id: true, name: true, email: true, status: true } },
      teacherAssignments: {
        select: assignmentSelect,
        orderBy: { startsAt: "desc" },
      },
    },
    orderBy: [{ status: "asc" }, { user: { name: "asc" } }],
  });
  return memberships.map((membership) => ({
    ...membership,
    status: membership.status === "ACTIVE" && membership.endsAt && membership.endsAt <= now ? "ENDED" as const : membership.status,
    teacherAssignments: membership.teacherAssignments.map((assignment) => ({
      ...assignment,
      status: assignment.status === "ACTIVE" && assignment.endsAt && assignment.endsAt <= now ? "ENDED" as const : assignment.status,
    })),
  }));
}

export async function createLocalAdult(input: {
  actor: AuthenticatedPrincipal;
  schoolId: string;
  name: string;
  email: string;
  temporaryPassword: string;
  role: SchoolMembershipRole;
  correlationId?: string;
}) {
  const name = cleanName(input.name);
  validateName(name);
  const email = adultEmail(input.email);
  const password = newPasswordSchema.safeParse(input.temporaryPassword);
  if (!password.success) throw new AuthorizationError("VALIDATION", password.error.issues[0]?.message ?? "Senha temporária inválida.");
  const passwordHash = await hashPassword(password.data);
  try {
    return await prisma.$transaction(async (transaction) => {
      const authorization = await authorizeSchoolPeopleManager(transaction, input.actor, input.schoolId, { requireActiveSchool: true });
      assertLocalRoleAllowed(authorization.managerRole, input.role);
      const existing = await transaction.user.findUnique({ where: { normalizedEmail: email }, select: { id: true } });
      if (existing) throw new AuthorizationError("STATE_CONFLICT", "A conta já existe. Use a opção de vincular conta existente.");
      const user = await transaction.user.create({
        data: { name, email, normalizedEmail: email, passwordHash },
        select: { id: true, name: true, email: true, status: true },
      });
      const membership = await transaction.schoolMembership.create({
        data: { userId: user.id, schoolId: input.schoolId, role: input.role },
        select: { id: true, role: true, status: true, startsAt: true, revision: true },
      });
      await transaction.auditEvent.create({
        data: {
          actorId: input.actor.id,
          action: "LOCAL_ADULT_CREATED_AND_LINKED",
          targetType: "SchoolMembership",
          targetId: membership.id,
          schoolId: input.schoolId,
          correlationId: input.correlationId ?? randomUUID(),
          after: { userId: user.id, role: membership.role, status: membership.status },
        },
      });
      return { user, membership };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    mapWriteError(error, "A conta ou o vínculo já existe.");
  }
}

export async function linkExistingAdult(input: {
  actor: AuthenticatedPrincipal;
  schoolId: string;
  email: string;
  role: SchoolMembershipRole;
  correlationId?: string;
}) {
  const email = adultEmail(input.email);
  try {
    return await prisma.$transaction(async (transaction) => {
      const authorization = await authorizeSchoolPeopleManager(transaction, input.actor, input.schoolId, { requireActiveSchool: true });
      assertLocalRoleAllowed(authorization.managerRole, input.role);
      const user = await transaction.user.findFirst({
        where: { normalizedEmail: email, studentCode: null, globalRole: null, status: "ACTIVE" },
        select: { id: true, name: true, email: true, status: true },
      });
      if (!user) throw new AuthorizationError("NOT_FOUND", "Conta adulta elegível não encontrada.");
      await transaction.schoolMembership.updateMany({
        where: { userId: user.id, schoolId: input.schoolId, status: "ACTIVE", endsAt: { lte: new Date() } },
        data: { status: "ENDED", revision: { increment: 1 } },
      });
      const membership = await transaction.schoolMembership.create({
        data: { userId: user.id, schoolId: input.schoolId, role: input.role },
        select: { id: true, role: true, status: true, startsAt: true, revision: true },
      });
      await transaction.auditEvent.create({
        data: {
          actorId: input.actor.id,
          action: "SCHOOL_MEMBERSHIP_CREATED",
          targetType: "SchoolMembership",
          targetId: membership.id,
          schoolId: input.schoolId,
          correlationId: input.correlationId ?? randomUUID(),
          after: { userId: user.id, role: membership.role, status: membership.status },
        },
      });
      return { user, membership };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    mapWriteError(error, "Já existe um vínculo ativo dessa conta com a escola.");
  }
}

export async function suspendLocalMembership(input: {
  actor: AuthenticatedPrincipal;
  schoolId: string;
  membershipId: string;
  revision: number;
  correlationId?: string;
}) {
  validateRevision(input.revision);
  if (!isUuid(input.membershipId)) throw new AuthorizationError("NOT_FOUND", "Vínculo não encontrado.");
  try {
    return await prisma.$transaction(async (transaction) => {
      const authorization = await authorizeSchoolPeopleManager(transaction, input.actor, input.schoolId);
      const correlationId = input.correlationId ?? randomUUID();
      const before = await transaction.schoolMembership.findFirst({
        where: { id: input.membershipId, schoolId: input.schoolId },
        select: { id: true, userId: true, schoolId: true, role: true, status: true, startsAt: true, revision: true },
      });
      if (!before) throw new AuthorizationError("NOT_FOUND", "Vínculo não encontrado.");
      assertLocalRoleAllowed(authorization.managerRole, before.role);
      const now = new Date();
      const changed = await transaction.schoolMembership.updateMany({
        where: { id: before.id, schoolId: input.schoolId, status: "ACTIVE", revision: input.revision },
        data: { status: "SUSPENDED", endsAt: safeEnd(before.startsAt, now), revision: { increment: 1 } },
      });
      if (changed.count !== 1) throw new AuthorizationError("STATE_CONFLICT", "O vínculo já foi alterado.");
      const activeAssignments = await transaction.teacherClassAssignment.findMany({
        where: { membershipId: before.id, status: "ACTIVE" },
        select: { id: true, teacherId: true, classId: true, startsAt: true, revision: true },
      });
      for (const assignment of activeAssignments) {
        const endsAt = safeEnd(assignment.startsAt, now);
        await transaction.teacherClassAssignment.update({
          where: { id: assignment.id },
          data: { status: "ENDED", endsAt, revision: { increment: 1 } },
        });
        await transaction.auditEvent.create({
          data: {
            actorId: input.actor.id,
            action: "TEACHER_CLASS_ASSIGNMENT_ENDED_BY_MEMBERSHIP",
            targetType: "TeacherClassAssignment",
            targetId: assignment.id,
            schoolId: input.schoolId,
            correlationId,
            before: { teacherId: assignment.teacherId, classId: assignment.classId, status: "ACTIVE", revision: assignment.revision },
            after: { teacherId: assignment.teacherId, classId: assignment.classId, status: "ENDED", revision: assignment.revision + 1, endsAt: endsAt.toISOString() },
          },
        });
      }
      const after = await transaction.schoolMembership.findUniqueOrThrow({
        where: { id: before.id },
        select: { id: true, userId: true, schoolId: true, role: true, status: true, endsAt: true, revision: true },
      });
      await transaction.auditEvent.create({
        data: {
          actorId: input.actor.id,
          action: "SCHOOL_MEMBERSHIP_SUSPENDED",
          targetType: "SchoolMembership",
          targetId: after.id,
          schoolId: input.schoolId,
          correlationId,
          before: { role: before.role, status: before.status, revision: before.revision },
          after: { role: after.role, status: after.status, revision: after.revision, endedAssignments: activeAssignments.length },
        },
      });
      return after;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    mapWriteError(error, "Não foi possível suspender o vínculo.");
  }
}

function validateAssignmentPeriod(startsAt: Date, endsAt?: Date | null) {
  if (Number.isNaN(startsAt.getTime()) || (endsAt && Number.isNaN(endsAt.getTime()))) {
    throw new AuthorizationError("VALIDATION", "Período da atribuição inválido.");
  }
  if (endsAt && endsAt <= startsAt) {
    throw new AuthorizationError("VALIDATION", "O término da atribuição deve ser posterior ao início.");
  }
}

export async function createTeacherAssignment(input: {
  actor: AuthenticatedPrincipal;
  schoolId: string;
  membershipId: string;
  classId: string;
  startsAt: Date;
  endsAt?: Date | null;
  correlationId?: string;
}) {
  validateAssignmentPeriod(input.startsAt, input.endsAt);
  if (!isUuid(input.membershipId) || !isUuid(input.classId)) {
    throw new AuthorizationError("VALIDATION", "Professor ou turma inválidos.");
  }
  try {
    return await prisma.$transaction(async (transaction) => {
      await authorizeSchoolPeopleManager(transaction, input.actor, input.schoolId, { requireActiveSchool: true });
      const membership = await transaction.schoolMembership.findFirst({
        where: {
          id: input.membershipId,
          schoolId: input.schoolId,
          role: "TEACHER",
          status: "ACTIVE",
          startsAt: { lte: input.startsAt },
          OR: [{ endsAt: null }, { endsAt: { gt: input.startsAt } }],
          user: { status: "ACTIVE", studentCode: null, globalRole: null },
        },
        select: { id: true, userId: true, startsAt: true, endsAt: true },
      });
      if (!membership) throw new AuthorizationError("NOT_FOUND", "Vínculo ativo de professor não encontrado nesta escola.");
      if (input.startsAt < membership.startsAt || (membership.endsAt && (!input.endsAt || input.endsAt > membership.endsAt))) {
        throw new AuthorizationError("VALIDATION", "O período da atribuição deve estar contido no vínculo escolar.");
      }
      const classGroup = await transaction.classGroup.findFirst({
        where: { id: input.classId, schoolId: input.schoolId, status: "ACTIVE", academicYear: { status: "ACTIVE" } },
        select: { id: true },
      });
      if (!classGroup) throw new AuthorizationError("NOT_FOUND", "Turma ativa não encontrada nesta escola.");
      await transaction.teacherClassAssignment.updateMany({
        where: { teacherId: membership.userId, classId: classGroup.id, status: "ACTIVE", endsAt: { lte: new Date() } },
        data: { status: "ENDED", revision: { increment: 1 } },
      });
      const assignment = await transaction.teacherClassAssignment.create({
        data: {
          membershipId: membership.id,
          teacherId: membership.userId,
          schoolId: input.schoolId,
          classId: classGroup.id,
          startsAt: input.startsAt,
          endsAt: input.endsAt ?? null,
        },
        select: assignmentSelect,
      });
      await transaction.auditEvent.create({
        data: {
          actorId: input.actor.id,
          action: "TEACHER_CLASS_ASSIGNMENT_CREATED",
          targetType: "TeacherClassAssignment",
          targetId: assignment.id,
          schoolId: input.schoolId,
          correlationId: input.correlationId ?? randomUUID(),
          after: { teacherId: assignment.teacherId, classId: assignment.classId, startsAt: assignment.startsAt.toISOString(), endsAt: assignment.endsAt?.toISOString() },
        },
      });
      return assignment;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    mapWriteError(error, "Já existe uma atribuição ativa deste professor para a turma.");
  }
}

export async function endTeacherAssignment(input: {
  actor: AuthenticatedPrincipal;
  schoolId: string;
  assignmentId: string;
  revision: number;
  correlationId?: string;
}) {
  validateRevision(input.revision);
  if (!isUuid(input.assignmentId)) throw new AuthorizationError("NOT_FOUND", "Atribuição não encontrada.");
  try {
    return await prisma.$transaction(async (transaction) => {
      await authorizeSchoolPeopleManager(transaction, input.actor, input.schoolId);
      const before = await transaction.teacherClassAssignment.findFirst({
        where: { id: input.assignmentId, schoolId: input.schoolId },
        select: { id: true, teacherId: true, classId: true, status: true, startsAt: true, revision: true },
      });
      if (!before) throw new AuthorizationError("NOT_FOUND", "Atribuição não encontrada.");
      const changed = await transaction.teacherClassAssignment.updateMany({
        where: { id: before.id, schoolId: input.schoolId, status: "ACTIVE", revision: input.revision },
        data: { status: "ENDED", endsAt: safeEnd(before.startsAt), revision: { increment: 1 } },
      });
      if (changed.count !== 1) throw new AuthorizationError("STATE_CONFLICT", "A atribuição já foi alterada.");
      const after = await transaction.teacherClassAssignment.findUniqueOrThrow({ where: { id: before.id }, select: assignmentSelect });
      await transaction.auditEvent.create({
        data: {
          actorId: input.actor.id,
          action: "TEACHER_CLASS_ASSIGNMENT_ENDED",
          targetType: "TeacherClassAssignment",
          targetId: after.id,
          schoolId: input.schoolId,
          correlationId: input.correlationId ?? randomUUID(),
          before: { teacherId: before.teacherId, classId: before.classId, status: before.status, revision: before.revision },
          after: { teacherId: after.teacherId, classId: after.classId, status: after.status, revision: after.revision, endsAt: after.endsAt?.toISOString() },
        },
      });
      return after;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    mapWriteError(error, "Não foi possível encerrar a atribuição.");
  }
}

export async function resolveActiveClassAssignment(input: { teacherId: string; classId: string }) {
  const now = new Date();
  return prisma.teacherClassAssignment.findFirst({
    where: {
      teacherId: input.teacherId,
      classId: input.classId,
      status: "ACTIVE",
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      teacher: { status: "ACTIVE", globalRole: null, studentCode: null },
      classGroup: { status: "ACTIVE", academicYear: { status: "ACTIVE" } },
      school: { status: "ACTIVE" },
      membership: {
        role: "TEACHER",
        status: "ACTIVE",
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      },
    },
    select: { teacherId: true, classId: true, schoolId: true },
  });
}

export async function listAssignedClasses(input: { actor: AuthenticatedPrincipal; schoolId: string }) {
  if (input.actor.globalRole || input.actor.studentCode) throw new AuthorizationError("FORBIDDEN", "Acesso não autorizado.");
  const now = new Date();
  const membership = await prisma.schoolMembership.findFirst({
    where: {
      userId: input.actor.id,
      schoolId: input.schoolId,
      role: "TEACHER",
      status: "ACTIVE",
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      school: { status: "ACTIVE" },
    },
    select: { id: true },
  });
  if (!membership) throw new AuthorizationError("FORBIDDEN", "Vínculo escolar não autorizado.");
  return prisma.teacherClassAssignment.findMany({
    where: {
      membershipId: membership.id,
      teacherId: input.actor.id,
      schoolId: input.schoolId,
      status: "ACTIVE",
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      classGroup: { status: "ACTIVE", academicYear: { status: "ACTIVE" } },
    },
    select: assignmentSelect,
    orderBy: [{ classGroup: { academicYear: { year: "desc" } } }, { classGroup: { grade: "asc" } }, { classGroup: { name: "asc" } }],
  });
}
