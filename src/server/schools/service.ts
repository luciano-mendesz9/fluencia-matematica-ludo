import "server-only";

import { randomUUID } from "node:crypto";
import type { SchoolMembershipRole, SchoolStatus } from "@/src/generated/prisma/enums";
import { prisma } from "@/src/lib/prisma";
import { AuthorizationError } from "@/src/server/auth/errors";
import { normalizeIdentifier } from "@/src/server/auth/normalization";
import { assertGlobalRole, type ActiveSchoolMembership, type AuthenticatedPrincipal } from "@/src/server/auth/policies";

export type SchoolOptionDto = {
  id: string;
  name: string;
  role: SchoolMembershipRole;
};

function currentMembershipWhere(now: Date) {
  return {
    status: "ACTIVE" as const,
    startsAt: { lte: now },
    OR: [{ endsAt: null }, { endsAt: { gt: now } }],
    school: { status: "ACTIVE" as const },
  };
}

function cleanName(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ");
}

function cleanExternalCode(value?: string | null) {
  const cleaned = value?.normalize("NFKC").trim().toLocaleUpperCase("pt-BR");
  return cleaned || null;
}

function isUniqueConflict(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export async function listAvailableSchools(userId: string, now = new Date()): Promise<SchoolOptionDto[]> {
  const memberships = await prisma.schoolMembership.findMany({
    where: { userId, ...currentMembershipWhere(now) },
    select: { role: true, school: { select: { id: true, name: true } } },
    orderBy: { school: { name: "asc" } },
  });
  return memberships.map(({ school, role }) => ({ id: school.id, name: school.name, role }));
}

export async function resolveActiveSchoolMembership(input: {
  userId: string;
  schoolId: string;
  now?: Date;
}): Promise<ActiveSchoolMembership | null> {
  const membership = await prisma.schoolMembership.findFirst({
    where: {
      userId: input.userId,
      schoolId: input.schoolId,
      ...currentMembershipWhere(input.now ?? new Date()),
    },
    select: { userId: true, schoolId: true, role: true },
  });
  return membership;
}

export async function listSchoolsForAdmin(actor: AuthenticatedPrincipal) {
  assertGlobalRole(actor, ["SEMED_ADMIN"]);
  const schools = await prisma.school.findMany({
    select: {
      id: true,
      name: true,
      externalCode: true,
      status: true,
      revision: true,
      _count: { select: { memberships: { where: { status: "ACTIVE" } } } },
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
  return schools.map(({ _count, ...school }) => ({ ...school, activeMemberships: _count.memberships }));
}

export async function getSchoolForAdmin(actor: AuthenticatedPrincipal, schoolId: string) {
  assertGlobalRole(actor, ["SEMED_ADMIN"]);
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: {
      id: true,
      name: true,
      externalCode: true,
      status: true,
      revision: true,
      memberships: {
        select: {
          id: true,
          role: true,
          status: true,
          startsAt: true,
          endsAt: true,
          revision: true,
          user: { select: { name: true, email: true } },
        },
        orderBy: [{ status: "asc" }, { user: { name: "asc" } }],
      },
    },
  });
  if (!school) throw new AuthorizationError("NOT_FOUND", "Escola não encontrada.");
  return school;
}

export async function getSchoolSummaryForAdmin(actor: AuthenticatedPrincipal, schoolId: string) {
  assertGlobalRole(actor, ["SEMED_ADMIN"]);
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { id: true, name: true, status: true },
  });
  if (!school) throw new AuthorizationError("NOT_FOUND", "Escola não encontrada.");
  return school;
}

export async function createSchool(input: {
  actor: AuthenticatedPrincipal;
  name: string;
  externalCode?: string | null;
  correlationId?: string;
}) {
  assertGlobalRole(input.actor, ["SEMED_ADMIN"]);
  const name = cleanName(input.name);
  const externalCode = cleanExternalCode(input.externalCode);
  if (name.length < 2 || name.length > 160 || (externalCode && externalCode.length > 80)) {
    throw new AuthorizationError("VALIDATION", "Dados da escola inválidos.");
  }
  try {
    return await prisma.$transaction(async (transaction) => {
      const school = await transaction.school.create({
        data: { name, externalCode },
        select: { id: true, name: true, externalCode: true, status: true, revision: true },
      });
      await transaction.auditEvent.create({
        data: {
          actorId: input.actor.id,
          action: "SCHOOL_CREATED",
          targetType: "School",
          targetId: school.id,
          schoolId: school.id,
          correlationId: input.correlationId ?? randomUUID(),
          after: school,
        },
      });
      return school;
    });
  } catch (error) {
    if (isUniqueConflict(error)) throw new AuthorizationError("STATE_CONFLICT", "O código da escola já está em uso.");
    throw error;
  }
}

export async function updateSchool(input: {
  actor: AuthenticatedPrincipal;
  schoolId: string;
  revision: number;
  name: string;
  externalCode?: string | null;
  status: SchoolStatus;
  correlationId?: string;
}) {
  assertGlobalRole(input.actor, ["SEMED_ADMIN"]);
  const name = cleanName(input.name);
  const externalCode = cleanExternalCode(input.externalCode);
  if (
    name.length < 2 ||
    name.length > 160 ||
    (externalCode && externalCode.length > 80) ||
    !Number.isInteger(input.revision) ||
    input.revision < 1
  ) {
    throw new AuthorizationError("VALIDATION", "Dados da escola inválidos.");
  }
  const before = await prisma.school.findUnique({
    where: { id: input.schoolId },
    select: { id: true, name: true, externalCode: true, status: true, revision: true },
  });
  if (!before) throw new AuthorizationError("NOT_FOUND", "Escola não encontrada.");
  if (input.status === "INACTIVE") {
    const [activeMemberships, activeAcademicYears, activeClasses] = await Promise.all([
      prisma.schoolMembership.count({
        where: { schoolId: input.schoolId, status: "ACTIVE", OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }] },
      }),
      prisma.academicYear.count({ where: { schoolId: input.schoolId, status: "ACTIVE" } }),
      prisma.classGroup.count({ where: { schoolId: input.schoolId, status: "ACTIVE" } }),
    ]);
    if (activeMemberships > 0 || activeAcademicYears > 0 || activeClasses > 0) {
      throw new AuthorizationError("STATE_CONFLICT", "Encerre vínculos, anos letivos e turmas ativos antes de inativar a escola.");
    }
  }
  try {
    return await prisma.$transaction(async (transaction) => {
      const changed = await transaction.school.updateMany({
        where: { id: input.schoolId, revision: input.revision },
        data: { name, externalCode, status: input.status, revision: { increment: 1 } },
      });
      if (changed.count !== 1) throw new AuthorizationError("STATE_CONFLICT", "A escola foi alterada por outra operação.");
      const after = await transaction.school.findUniqueOrThrow({
        where: { id: input.schoolId },
        select: { id: true, name: true, externalCode: true, status: true, revision: true },
      });
      await transaction.auditEvent.create({
        data: {
          actorId: input.actor.id,
          action: "SCHOOL_UPDATED",
          targetType: "School",
          targetId: after.id,
          schoolId: after.id,
          correlationId: input.correlationId ?? randomUUID(),
          before,
          after,
        },
      });
      return after;
    });
  } catch (error) {
    if (isUniqueConflict(error)) throw new AuthorizationError("STATE_CONFLICT", "O código da escola já está em uso.");
    throw error;
  }
}

export async function addSchoolMembership(input: {
  actor: AuthenticatedPrincipal;
  schoolId: string;
  adultEmail: string;
  role: SchoolMembershipRole;
  startsAt?: Date;
  correlationId?: string;
}) {
  assertGlobalRole(input.actor, ["SEMED_ADMIN"]);
  const normalized = normalizeIdentifier(input.adultEmail);
  if (normalized.kind !== "adult") throw new AuthorizationError("VALIDATION", "Informe o e-mail de uma conta adulta.");
  const [school, user] = await Promise.all([
    prisma.school.findFirst({ where: { id: input.schoolId, status: "ACTIVE" }, select: { id: true } }),
    prisma.user.findFirst({
      where: { normalizedEmail: normalized.value, studentCode: null, status: "ACTIVE", globalRole: null },
      select: { id: true, name: true, email: true },
    }),
  ]);
  if (!school) throw new AuthorizationError("NOT_FOUND", "Escola não encontrada ou inativa.");
  if (!user) throw new AuthorizationError("NOT_FOUND", "Conta adulta elegível não encontrada.");
  const startsAt = input.startsAt ?? new Date();
  try {
    return await prisma.$transaction(async (transaction) => {
      const membership = await transaction.schoolMembership.create({
        data: { userId: user.id, schoolId: school.id, role: input.role, startsAt },
        select: { id: true, role: true, status: true, startsAt: true, revision: true },
      });
      await transaction.auditEvent.create({
        data: {
          actorId: input.actor.id,
          action: "SCHOOL_MEMBERSHIP_CREATED",
          targetType: "SchoolMembership",
          targetId: membership.id,
          schoolId: school.id,
          correlationId: input.correlationId ?? randomUUID(),
          after: { userId: user.id, role: membership.role, status: membership.status, startsAt: membership.startsAt.toISOString() },
        },
      });
      return { ...membership, user };
    });
  } catch (error) {
    if (isUniqueConflict(error)) throw new AuthorizationError("STATE_CONFLICT", "Já existe um vínculo ativo dessa conta com a escola.");
    throw error;
  }
}

export async function suspendSchoolMembership(input: {
  actor: AuthenticatedPrincipal;
  membershipId: string;
  revision: number;
  correlationId?: string;
}) {
  assertGlobalRole(input.actor, ["SEMED_ADMIN"]);
  const before = await prisma.schoolMembership.findUnique({
    where: { id: input.membershipId },
    select: { id: true, userId: true, schoolId: true, role: true, status: true, revision: true },
  });
  if (!before) throw new AuthorizationError("NOT_FOUND", "Vínculo não encontrado.");
  const now = new Date();
  return prisma.$transaction(async (transaction) => {
    const changed = await transaction.schoolMembership.updateMany({
      where: { id: input.membershipId, revision: input.revision, status: "ACTIVE" },
      data: { status: "SUSPENDED", endsAt: now, revision: { increment: 1 } },
    });
    if (changed.count !== 1) throw new AuthorizationError("STATE_CONFLICT", "O vínculo já foi alterado.");
    const after = await transaction.schoolMembership.findUniqueOrThrow({
      where: { id: input.membershipId },
      select: { id: true, userId: true, schoolId: true, role: true, status: true, revision: true, endsAt: true },
    });
    await transaction.auditEvent.create({
      data: {
        actorId: input.actor.id,
        action: "SCHOOL_MEMBERSHIP_SUSPENDED",
        targetType: "SchoolMembership",
        targetId: after.id,
        schoolId: after.schoolId,
        correlationId: input.correlationId ?? randomUUID(),
        before,
        after: { ...after, endsAt: after.endsAt?.toISOString() },
      },
    });
    return after;
  });
}
