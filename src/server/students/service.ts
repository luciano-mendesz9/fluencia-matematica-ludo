import "server-only";

import { randomBytes, randomUUID } from "node:crypto";
import { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/src/lib/prisma";
import { AuthorizationError } from "@/src/server/auth/errors";
import { hashPassword } from "@/src/server/auth/password";
import { newPasswordSchema } from "@/src/server/auth/password-policy";
import type { AuthenticatedPrincipal } from "@/src/server/auth/policies";
import { authorizeSchoolManager, isUuid } from "@/src/server/schools/management";

const CODE_ATTEMPTS = 4;

const enrollmentSelect = {
  id: true,
  classId: true,
  schoolId: true,
  status: true,
  startsAt: true,
  endsAt: true,
  revision: true,
  classGroup: {
    select: {
      name: true,
      grade: true,
      academicYear: { select: { year: true } },
    },
  },
} as const;

function cleanStudentName(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ");
}

export function generateStudentCode() {
  return `AL-${randomBytes(8).toString("hex").toUpperCase()}`;
}

function validateName(name: string) {
  if (name.length < 2 || name.length > 160) {
    throw new AuthorizationError("VALIDATION", "Informe o nome do aluno com 2 a 160 caracteres.");
  }
}

function validateRevision(revision: number) {
  if (!Number.isInteger(revision) || revision < 1) {
    throw new AuthorizationError("VALIDATION", "Revisão da matrícula inválida.");
  }
}

function isPrismaCode(error: unknown, code: string) {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

function transferTimestamp(startsAt: Date) {
  const now = new Date();
  return now > startsAt ? now : new Date(startsAt.getTime() + 1);
}

async function findActiveTargetClass(transaction: Prisma.TransactionClient, schoolId: string, classId: string) {
  if (!isUuid(classId)) throw new AuthorizationError("VALIDATION", "Turma inválida.");
  const classGroup = await transaction.classGroup.findFirst({
    where: {
      id: classId,
      schoolId,
      status: "ACTIVE",
      academicYear: { status: "ACTIVE" },
      school: { status: "ACTIVE" },
    },
    select: { id: true, name: true, grade: true, academicYear: { select: { year: true } } },
  });
  if (!classGroup) throw new AuthorizationError("NOT_FOUND", "Turma ativa não encontrada nesta escola.");
  return classGroup;
}

export async function listStudents(input: { actor: AuthenticatedPrincipal; schoolId: string }) {
  await authorizeSchoolManager(prisma, input.actor, input.schoolId);
  const students = await prisma.user.findMany({
    where: {
      studentCode: { not: null },
      enrollments: { some: { schoolId: input.schoolId } },
    },
    select: {
      id: true,
      name: true,
      status: true,
      enrollments: {
        where: { schoolId: input.schoolId },
        select: enrollmentSelect,
        orderBy: { startsAt: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });
  return students.map(({ enrollments, ...student }) => ({
    ...student,
    activeEnrollment: enrollments.find((enrollment) => enrollment.status === "ACTIVE") ?? null,
    enrollmentCount: enrollments.length,
  }));
}

export async function getStudent(input: { actor: AuthenticatedPrincipal; schoolId: string; studentId: string }) {
  await authorizeSchoolManager(prisma, input.actor, input.schoolId);
  if (!isUuid(input.studentId)) throw new AuthorizationError("NOT_FOUND", "Aluno não encontrado.");
  const student = await prisma.user.findFirst({
    where: {
      id: input.studentId,
      studentCode: { not: null },
      enrollments: { some: { schoolId: input.schoolId } },
    },
    select: {
      id: true,
      name: true,
      status: true,
      enrollments: {
        where: { schoolId: input.schoolId },
        select: enrollmentSelect,
        orderBy: { startsAt: "desc" },
      },
    },
  });
  if (!student) throw new AuthorizationError("NOT_FOUND", "Aluno não encontrado.");
  return {
    ...student,
    activeEnrollment: student.enrollments.find((enrollment) => enrollment.status === "ACTIVE") ?? null,
  };
}

export async function createStudent(input: {
  actor: AuthenticatedPrincipal;
  schoolId: string;
  classId: string;
  name: string;
  temporaryPassword: string;
  correlationId?: string;
}) {
  const name = cleanStudentName(input.name);
  validateName(name);
  const password = newPasswordSchema.safeParse(input.temporaryPassword);
  if (!password.success) {
    throw new AuthorizationError("VALIDATION", password.error.issues[0]?.message ?? "Senha temporária inválida.");
  }
  const passwordHash = await hashPassword(password.data);
  for (let attempt = 1; attempt <= CODE_ATTEMPTS; attempt += 1) {
    const studentCode = generateStudentCode();
    try {
      return await prisma.$transaction(async (transaction) => {
        await authorizeSchoolManager(transaction, input.actor, input.schoolId, { requireActiveSchool: true });
        const classGroup = await findActiveTargetClass(transaction, input.schoolId, input.classId);
        const student = await transaction.user.create({
          data: { name, studentCode, passwordHash },
          select: { id: true, name: true, status: true },
        });
        const enrollment = await transaction.enrollment.create({
          data: { studentId: student.id, schoolId: input.schoolId, classId: classGroup.id },
          select: enrollmentSelect,
        });
        await transaction.auditEvent.create({
          data: {
            actorId: input.actor.id,
            action: "STUDENT_CREATED_AND_ENROLLED",
            targetType: "User",
            targetId: student.id,
            schoolId: input.schoolId,
            correlationId: input.correlationId ?? randomUUID(),
            after: { enrollmentId: enrollment.id, classId: enrollment.classId, studentCodeIssued: true },
          },
        });
        return { student, enrollment, studentCode };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (isPrismaCode(error, "P2002") && attempt < CODE_ATTEMPTS) continue;
      if (error instanceof AuthorizationError) throw error;
      if (isPrismaCode(error, "P2002")) {
        throw new AuthorizationError("STATE_CONFLICT", "Não foi possível gerar um código único. Tente novamente.");
      }
      if (isPrismaCode(error, "P2034")) {
        throw new AuthorizationError("STATE_CONFLICT", "O cadastro sofreu uma alteração concorrente. Tente novamente.");
      }
      throw error;
    }
  }
  throw new AuthorizationError("STATE_CONFLICT", "Não foi possível gerar um código único. Tente novamente.");
}

export async function transferStudent(input: {
  actor: AuthenticatedPrincipal;
  schoolId: string;
  studentId: string;
  targetClassId: string;
  enrollmentRevision: number;
  correlationId?: string;
}) {
  validateRevision(input.enrollmentRevision);
  if (!isUuid(input.studentId)) throw new AuthorizationError("NOT_FOUND", "Aluno não encontrado.");
  try {
    return await prisma.$transaction(async (transaction) => {
      await authorizeSchoolManager(transaction, input.actor, input.schoolId, { requireActiveSchool: true });
      const targetClass = await findActiveTargetClass(transaction, input.schoolId, input.targetClassId);
      const student = await transaction.user.findFirst({
        where: { id: input.studentId, studentCode: { not: null }, status: "ACTIVE" },
        select: { id: true },
      });
      if (!student) throw new AuthorizationError("NOT_FOUND", "Aluno ativo não encontrado.");
      const current = await transaction.enrollment.findFirst({
        where: { studentId: student.id, status: "ACTIVE" },
        select: { id: true, schoolId: true, classId: true, startsAt: true, revision: true },
      });
      if (!current || current.schoolId !== input.schoolId) {
        throw new AuthorizationError("NOT_FOUND", "Matrícula ativa não encontrada nesta escola.");
      }
      if (current.classId === targetClass.id) {
        throw new AuthorizationError("STATE_CONFLICT", "O aluno já está matriculado nessa turma.");
      }
      const at = transferTimestamp(current.startsAt);
      const ended = await transaction.enrollment.updateMany({
        where: { id: current.id, schoolId: input.schoolId, status: "ACTIVE", revision: input.enrollmentRevision },
        data: { status: "ENDED", endsAt: at, revision: { increment: 1 } },
      });
      if (ended.count !== 1) throw new AuthorizationError("STATE_CONFLICT", "A matrícula foi alterada por outra operação.");
      const enrollment = await transaction.enrollment.create({
        data: { studentId: student.id, schoolId: input.schoolId, classId: targetClass.id, startsAt: at },
        select: enrollmentSelect,
      });
      await transaction.auditEvent.create({
        data: {
          actorId: input.actor.id,
          action: "STUDENT_ENROLLMENT_TRANSFERRED",
          targetType: "Enrollment",
          targetId: enrollment.id,
          schoolId: input.schoolId,
          correlationId: input.correlationId ?? randomUUID(),
          before: { enrollmentId: current.id, classId: current.classId, revision: current.revision },
          after: { enrollmentId: enrollment.id, classId: enrollment.classId, revision: enrollment.revision },
        },
      });
      return enrollment;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof AuthorizationError) throw error;
    if (isPrismaCode(error, "P2002") || isPrismaCode(error, "P2034")) {
      throw new AuthorizationError("STATE_CONFLICT", "A matrícula foi alterada por outra operação.");
    }
    throw error;
  }
}

export async function endEnrollment(input: {
  actor: AuthenticatedPrincipal;
  schoolId: string;
  studentId: string;
  enrollmentRevision: number;
  correlationId?: string;
}) {
  validateRevision(input.enrollmentRevision);
  if (!isUuid(input.studentId)) throw new AuthorizationError("NOT_FOUND", "Aluno não encontrado.");
  try {
    return await prisma.$transaction(async (transaction) => {
      await authorizeSchoolManager(transaction, input.actor, input.schoolId);
      const current = await transaction.enrollment.findFirst({
        where: { studentId: input.studentId, schoolId: input.schoolId, status: "ACTIVE", student: { studentCode: { not: null } } },
        select: { id: true, studentId: true, classId: true, startsAt: true, revision: true },
      });
      if (!current) throw new AuthorizationError("NOT_FOUND", "Matrícula ativa não encontrada nesta escola.");
      const at = transferTimestamp(current.startsAt);
      const ended = await transaction.enrollment.updateMany({
        where: { id: current.id, schoolId: input.schoolId, status: "ACTIVE", revision: input.enrollmentRevision },
        data: { status: "ENDED", endsAt: at, revision: { increment: 1 } },
      });
      if (ended.count !== 1) throw new AuthorizationError("STATE_CONFLICT", "A matrícula foi alterada por outra operação.");
      const enrollment = await transaction.enrollment.findUniqueOrThrow({
        where: { id: current.id },
        select: enrollmentSelect,
      });
      await transaction.auditEvent.create({
        data: {
          actorId: input.actor.id,
          action: "STUDENT_ENROLLMENT_ENDED",
          targetType: "Enrollment",
          targetId: enrollment.id,
          schoolId: input.schoolId,
          correlationId: input.correlationId ?? randomUUID(),
          before: { classId: current.classId, revision: current.revision, status: "ACTIVE" },
          after: { classId: enrollment.classId, revision: enrollment.revision, status: enrollment.status, endsAt: enrollment.endsAt?.toISOString() },
        },
      });
      return enrollment;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof AuthorizationError) throw error;
    if (isPrismaCode(error, "P2034")) {
      throw new AuthorizationError("STATE_CONFLICT", "A matrícula foi alterada por outra operação.");
    }
    throw error;
  }
}

export async function authorizeCoordinatorStudentReset(input: { actorId: string; studentId: string; schoolId: string }) {
  const now = new Date();
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId: input.studentId,
      schoolId: input.schoolId,
      status: "ACTIVE",
      student: { studentCode: { not: null }, status: "ACTIVE" },
      school: {
        status: "ACTIVE",
        memberships: {
          some: {
            userId: input.actorId,
            role: "COORDINATOR",
            status: "ACTIVE",
            startsAt: { lte: now },
            OR: [{ endsAt: null }, { endsAt: { gt: now } }],
          },
        },
      },
    },
    select: { schoolId: true },
  });
  return enrollment ? { schoolId: enrollment.schoolId, role: "COORDINATOR" as const } : null;
}
