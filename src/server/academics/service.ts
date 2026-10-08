import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@/src/generated/prisma/client";
import type { AcademicYearStatus, ClassGroupStatus } from "@/src/generated/prisma/enums";
import { prisma } from "@/src/lib/prisma";
import { AuthorizationError } from "@/src/server/auth/errors";
import type { AuthenticatedPrincipal } from "@/src/server/auth/policies";
import { authorizeSchoolManager, isUuid } from "@/src/server/schools/management";

const academicYearSelect = {
  id: true,
  schoolId: true,
  year: true,
  status: true,
  revision: true,
  _count: { select: { classGroups: true } },
} as const;

const classGroupSelect = {
  id: true,
  schoolId: true,
  academicYearId: true,
  grade: true,
  name: true,
  status: true,
  revision: true,
  academicYear: { select: { year: true, status: true } },
} as const;

function cleanClassName(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ");
}

function normalizedClassName(value: string) {
  return cleanClassName(value).toLocaleLowerCase("pt-BR");
}

function validateYear(year: number) {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new AuthorizationError("VALIDATION", "Informe um ano letivo entre 2000 e 2100.");
  }
}

function validateRevision(revision: number) {
  if (!Number.isInteger(revision) || revision < 1) {
    throw new AuthorizationError("VALIDATION", "Revisão inválida.");
  }
}

function validateClassFields(grade: number, name: string) {
  if (!Number.isInteger(grade) || grade < 1 || grade > 5) {
    throw new AuthorizationError("VALIDATION", "A série deve estar entre o 1º e o 5º ano.");
  }
  if (name.length < 1 || name.length > 120) {
    throw new AuthorizationError("VALIDATION", "Informe um nome de turma com até 120 caracteres.");
  }
}

function isPrismaCode(error: unknown, code: string) {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

function mapWriteError(error: unknown, duplicateMessage: string): never {
  if (isPrismaCode(error, "P2002")) throw new AuthorizationError("STATE_CONFLICT", duplicateMessage);
  if (isPrismaCode(error, "P2034")) {
    throw new AuthorizationError("STATE_CONFLICT", "Os dados foram alterados por outra operação. Atualize a página e tente novamente.");
  }
  throw error;
}

function auditYear(year: { id: string; schoolId: string; year: number; status: AcademicYearStatus; revision: number }) {
  return { id: year.id, schoolId: year.schoolId, year: year.year, status: year.status, revision: year.revision };
}

function auditClass(group: {
  id: string;
  schoolId: string;
  academicYearId: string;
  grade: number;
  name: string;
  status: ClassGroupStatus;
  revision: number;
}) {
  return {
    id: group.id,
    schoolId: group.schoolId,
    academicYearId: group.academicYearId,
    grade: group.grade,
    name: group.name,
    status: group.status,
    revision: group.revision,
  };
}

export async function listAcademicYears(input: { actor: AuthenticatedPrincipal; schoolId: string }) {
  await authorizeSchoolManager(prisma, input.actor, input.schoolId);
  return prisma.academicYear.findMany({
    where: { schoolId: input.schoolId },
    select: academicYearSelect,
    orderBy: [{ year: "desc" }],
  });
}

export async function getAcademicYear(input: { actor: AuthenticatedPrincipal; schoolId: string; academicYearId: string }) {
  await authorizeSchoolManager(prisma, input.actor, input.schoolId);
  if (!isUuid(input.academicYearId)) throw new AuthorizationError("NOT_FOUND", "Ano letivo não encontrado.");
  const year = await prisma.academicYear.findFirst({
    where: { id: input.academicYearId, schoolId: input.schoolId },
    select: academicYearSelect,
  });
  if (!year) throw new AuthorizationError("NOT_FOUND", "Ano letivo não encontrado.");
  return year;
}

export async function createAcademicYear(input: {
  actor: AuthenticatedPrincipal;
  schoolId: string;
  year: number;
  correlationId?: string;
}) {
  validateYear(input.year);
  try {
    return await prisma.$transaction(async (transaction) => {
      await authorizeSchoolManager(transaction, input.actor, input.schoolId, { requireActiveSchool: true });
      const year = await transaction.academicYear.create({
        data: { schoolId: input.schoolId, year: input.year },
        select: academicYearSelect,
      });
      await transaction.auditEvent.create({
        data: {
          actorId: input.actor.id,
          action: "ACADEMIC_YEAR_CREATED",
          targetType: "AcademicYear",
          targetId: year.id,
          schoolId: input.schoolId,
          correlationId: input.correlationId ?? randomUUID(),
          after: auditYear(year),
        },
      });
      return year;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    mapWriteError(error, "Este ano letivo já está cadastrado na escola.");
  }
}

export async function updateAcademicYear(input: {
  actor: AuthenticatedPrincipal;
  schoolId: string;
  academicYearId: string;
  year: number;
  status: AcademicYearStatus;
  revision: number;
  correlationId?: string;
}) {
  validateYear(input.year);
  validateRevision(input.revision);
  if (!isUuid(input.academicYearId)) throw new AuthorizationError("NOT_FOUND", "Ano letivo não encontrado.");
  try {
    return await prisma.$transaction(async (transaction) => {
      await authorizeSchoolManager(transaction, input.actor, input.schoolId);
      const before = await transaction.academicYear.findFirst({
        where: { id: input.academicYearId, schoolId: input.schoolId },
        select: academicYearSelect,
      });
      if (!before) throw new AuthorizationError("NOT_FOUND", "Ano letivo não encontrado.");
      if (input.status === "INACTIVE") {
        const activeClasses = await transaction.classGroup.count({
          where: { academicYearId: before.id, schoolId: input.schoolId, status: "ACTIVE" },
        });
        if (activeClasses > 0) {
          throw new AuthorizationError("STATE_CONFLICT", "Inative as turmas ativas antes de encerrar o ano letivo.");
        }
      }
      const changed = await transaction.academicYear.updateMany({
        where: { id: before.id, schoolId: input.schoolId, revision: input.revision },
        data: { year: input.year, status: input.status, revision: { increment: 1 } },
      });
      if (changed.count !== 1) throw new AuthorizationError("STATE_CONFLICT", "O ano letivo foi alterado por outra operação.");
      const after = await transaction.academicYear.findUniqueOrThrow({
        where: { id: before.id },
        select: academicYearSelect,
      });
      await transaction.auditEvent.create({
        data: {
          actorId: input.actor.id,
          action: "ACADEMIC_YEAR_UPDATED",
          targetType: "AcademicYear",
          targetId: after.id,
          schoolId: input.schoolId,
          correlationId: input.correlationId ?? randomUUID(),
          before: auditYear(before),
          after: auditYear(after),
        },
      });
      return after;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof AuthorizationError) throw error;
    mapWriteError(error, "Este ano letivo já está cadastrado na escola.");
  }
}

export async function listClassGroups(input: { actor: AuthenticatedPrincipal; schoolId: string }) {
  await authorizeSchoolManager(prisma, input.actor, input.schoolId);
  return prisma.classGroup.findMany({
    where: { schoolId: input.schoolId },
    select: classGroupSelect,
    orderBy: [{ academicYear: { year: "desc" } }, { grade: "asc" }, { name: "asc" }],
  });
}

export async function getClassGroup(input: { actor: AuthenticatedPrincipal; schoolId: string; classGroupId: string }) {
  await authorizeSchoolManager(prisma, input.actor, input.schoolId);
  if (!isUuid(input.classGroupId)) throw new AuthorizationError("NOT_FOUND", "Turma não encontrada.");
  const group = await prisma.classGroup.findFirst({
    where: { id: input.classGroupId, schoolId: input.schoolId },
    select: classGroupSelect,
  });
  if (!group) throw new AuthorizationError("NOT_FOUND", "Turma não encontrada.");
  return group;
}

export async function createClassGroup(input: {
  actor: AuthenticatedPrincipal;
  schoolId: string;
  academicYearId: string;
  grade: number;
  name: string;
  correlationId?: string;
}) {
  const name = cleanClassName(input.name);
  validateClassFields(input.grade, name);
  if (!isUuid(input.academicYearId)) throw new AuthorizationError("VALIDATION", "Ano letivo inválido.");
  try {
    return await prisma.$transaction(async (transaction) => {
      await authorizeSchoolManager(transaction, input.actor, input.schoolId, { requireActiveSchool: true });
      const academicYear = await transaction.academicYear.findFirst({
        where: { id: input.academicYearId, schoolId: input.schoolId, status: "ACTIVE" },
        select: { id: true },
      });
      if (!academicYear) throw new AuthorizationError("NOT_FOUND", "Ano letivo ativo não encontrado nesta escola.");
      const group = await transaction.classGroup.create({
        data: {
          schoolId: input.schoolId,
          academicYearId: academicYear.id,
          grade: input.grade,
          name,
          normalizedName: normalizedClassName(name),
        },
        select: classGroupSelect,
      });
      await transaction.auditEvent.create({
        data: {
          actorId: input.actor.id,
          action: "CLASS_GROUP_CREATED",
          targetType: "ClassGroup",
          targetId: group.id,
          schoolId: input.schoolId,
          correlationId: input.correlationId ?? randomUUID(),
          after: auditClass(group),
        },
      });
      return group;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof AuthorizationError) throw error;
    mapWriteError(error, "Já existe uma turma com este nome no ano letivo.");
  }
}

export async function updateClassGroup(input: {
  actor: AuthenticatedPrincipal;
  schoolId: string;
  classGroupId: string;
  academicYearId: string;
  grade: number;
  name: string;
  status: ClassGroupStatus;
  revision: number;
  correlationId?: string;
}) {
  const name = cleanClassName(input.name);
  validateClassFields(input.grade, name);
  validateRevision(input.revision);
  if (!isUuid(input.classGroupId) || !isUuid(input.academicYearId)) {
    throw new AuthorizationError("NOT_FOUND", "Turma ou ano letivo não encontrado.");
  }
  try {
    return await prisma.$transaction(async (transaction) => {
      await authorizeSchoolManager(transaction, input.actor, input.schoolId);
      const before = await transaction.classGroup.findFirst({
        where: { id: input.classGroupId, schoolId: input.schoolId },
        select: classGroupSelect,
      });
      if (!before) throw new AuthorizationError("NOT_FOUND", "Turma não encontrada.");
      const targetYear = await transaction.academicYear.findFirst({
        where: { id: input.academicYearId, schoolId: input.schoolId },
        select: { id: true, status: true },
      });
      if (!targetYear) throw new AuthorizationError("NOT_FOUND", "Ano letivo não encontrado nesta escola.");
      if (input.status === "ACTIVE" && targetYear.status !== "ACTIVE") {
        throw new AuthorizationError("STATE_CONFLICT", "Uma turma ativa precisa pertencer a um ano letivo ativo.");
      }
      if (input.status === "INACTIVE") {
        const activeEnrollments = await transaction.enrollment.count({
          where: { classId: before.id, schoolId: input.schoolId, status: "ACTIVE" },
        });
        if (activeEnrollments > 0) {
          throw new AuthorizationError("STATE_CONFLICT", "Encerre ou transfira as matrículas ativas antes de inativar a turma.");
        }
      }
      const changed = await transaction.classGroup.updateMany({
        where: { id: before.id, schoolId: input.schoolId, revision: input.revision },
        data: {
          academicYearId: targetYear.id,
          grade: input.grade,
          name,
          normalizedName: normalizedClassName(name),
          status: input.status,
          revision: { increment: 1 },
        },
      });
      if (changed.count !== 1) throw new AuthorizationError("STATE_CONFLICT", "A turma foi alterada por outra operação.");
      const after = await transaction.classGroup.findUniqueOrThrow({
        where: { id: before.id },
        select: classGroupSelect,
      });
      await transaction.auditEvent.create({
        data: {
          actorId: input.actor.id,
          action: "CLASS_GROUP_UPDATED",
          targetType: "ClassGroup",
          targetId: after.id,
          schoolId: input.schoolId,
          correlationId: input.correlationId ?? randomUUID(),
          before: auditClass(before),
          after: auditClass(after),
        },
      });
      return after;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof AuthorizationError) throw error;
    mapWriteError(error, "Já existe uma turma com este nome no ano letivo.");
  }
}
