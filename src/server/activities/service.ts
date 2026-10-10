import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/src/lib/prisma";
import { AuthorizationError } from "@/src/server/auth/errors";
import type { AuthenticatedPrincipal } from "@/src/server/auth/policies";
import { clean, mapWrite, uuid } from "@/src/server/questions/service";

const activeWindow = (now = new Date()) => ({ startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] });

function validateRevision(revision: number) {
  if (!Number.isInteger(revision) || revision < 1) throw new AuthorizationError("VALIDATION", "Revisão inválida.");
}

function validateDraft(input: { title: string; instructions?: string | null; targetCount: number; questionVersionIds: string[] }) {
  const title = clean(input.title);
  const instructions = input.instructions ? clean(input.instructions) : null;
  if (title.length < 3 || title.length > 160) throw new AuthorizationError("VALIDATION", "Informe um título com 3 a 160 caracteres.");
  if (instructions && instructions.length > 1000) throw new AuthorizationError("VALIDATION", "As orientações devem ter até 1.000 caracteres.");
  if (!Number.isInteger(input.targetCount) || input.targetCount < 1 || input.targetCount > 1000) throw new AuthorizationError("VALIDATION", "A meta deve ser um número entre 1 e 1.000.");
  const questionVersionIds = [...new Set(input.questionVersionIds)];
  questionVersionIds.forEach((id) => uuid(id, "Versão de questão inválida."));
  return { title, instructions, targetCount: input.targetCount, questionVersionIds };
}

async function assignedClass(client: Prisma.TransactionClient | typeof prisma, actor: AuthenticatedPrincipal, classId: string, schoolId?: string) {
  uuid(classId, "Turma inválida.");
  if (actor.studentCode || actor.globalRole) throw new AuthorizationError("FORBIDDEN", "Somente professores atribuídos podem gerenciar atividades.");
  const now = new Date();
  const assignment = await client.teacherClassAssignment.findFirst({
    where: {
      teacherId: actor.id, classId, ...(schoolId ? { schoolId } : {}), status: "ACTIVE", ...activeWindow(now),
      membership: { role: "TEACHER", status: "ACTIVE", ...activeWindow(now) },
      teacher: { status: "ACTIVE", globalRole: null, studentCode: null },
      school: { status: "ACTIVE" }, classGroup: { status: "ACTIVE", academicYear: { status: "ACTIVE" } },
    },
    select: { classGroup: { select: { id: true, schoolId: true, grade: true, name: true, academicYear: { select: { year: true } } } } },
  });
  if (!assignment) throw new AuthorizationError("FORBIDDEN", "A turma não está atribuída ao professor nesta escola.");
  return assignment.classGroup;
}

async function eligibleVersions(client: Prisma.TransactionClient | typeof prisma, actor: AuthenticatedPrincipal, grade: number, ids?: string[]) {
  const versions = await client.questionVersion.findMany({
    where: {
      ...(ids ? { id: { in: ids } } : {}), grade, answerType: { not: null },
      question: { status: "ACTIVE", OR: [{ origin: "SEMED" }, { origin: "PRIVATE", ownerId: actor.id }] },
    },
    select: { id: true, versionNumber: true, grade: true, difficulty: true, statement: true, answerType: true, question: { select: { id: true, origin: true, ownerId: true, latestVersionNumber: true } }, theme: { select: { name: true } }, skill: { select: { name: true } } },
    orderBy: [{ difficulty: "asc" }, { createdAt: "desc" }],
  });
  return versions.filter((version) => version.versionNumber === version.question.latestVersionNumber);
}

export function coverageFor(versions: Array<{ difficulty: number }>) {
  const counts = [1, 2, 3, 4, 5, 6].map((difficulty) => ({ difficulty, count: versions.filter((v) => v.difficulty === difficulty).length }));
  return { counts, gaps: counts.filter(({ count }) => count === 0).map(({ difficulty }) => difficulty), complete: counts.every(({ count }) => count > 0) };
}

export async function listActivityAuthoringOptions(input: { actor: AuthenticatedPrincipal; schoolId: string }) {
  uuid(input.schoolId, "Escola inválida.");
  const now = new Date();
  if (input.actor.studentCode || input.actor.globalRole) throw new AuthorizationError("FORBIDDEN", "Acesso não autorizado.");
  const assignments = await prisma.teacherClassAssignment.findMany({
    where: { teacherId: input.actor.id, schoolId: input.schoolId, status: "ACTIVE", ...activeWindow(now), membership: { role: "TEACHER", status: "ACTIVE", ...activeWindow(now) }, school: { status: "ACTIVE" }, classGroup: { status: "ACTIVE", academicYear: { status: "ACTIVE" } } },
    select: { classGroup: { select: { id: true, name: true, grade: true, academicYear: { select: { year: true } } } } }, orderBy: { classGroup: { name: "asc" } },
  });
  const grades = [...new Set(assignments.map(({ classGroup }) => classGroup.grade))];
  const versions = grades.length ? await prisma.questionVersion.findMany({
    where: { grade: { in: grades }, answerType: { not: null }, question: { status: "ACTIVE", OR: [{ origin: "SEMED" }, { origin: "PRIVATE", ownerId: input.actor.id }] } },
    select: { id: true, versionNumber: true, grade: true, difficulty: true, statement: true, theme: { select: { name: true } }, skill: { select: { name: true } }, question: { select: { origin: true, latestVersionNumber: true } } },
    orderBy: [{ grade: "asc" }, { difficulty: "asc" }, { createdAt: "desc" }],
  }) : [];
  return { classes: assignments.map(({ classGroup }) => classGroup), versions: versions.filter((v) => v.versionNumber === v.question.latestVersionNumber) };
}

export async function createActivity(input: { actor: AuthenticatedPrincipal; classId: string; schoolId: string; title: string; instructions?: string | null; targetCount: number; questionVersionIds: string[]; correlationId?: string }) {
  const draft = validateDraft(input); uuid(input.schoolId, "Escola inválida.");
  try {
    return await prisma.$transaction(async (tx) => {
      const group = await assignedClass(tx, input.actor, input.classId, input.schoolId);
      const versions = await eligibleVersions(tx, input.actor, group.grade, draft.questionVersionIds);
      if (versions.length !== draft.questionVersionIds.length) throw new AuthorizationError("VALIDATION", "A seleção contém questão indisponível, de outra série ou privada de outro autor.");
      const activity = await tx.activity.create({ data: { schoolId: group.schoolId, classId: group.id, teacherId: input.actor.id, title: draft.title, instructions: draft.instructions, targetCount: draft.targetCount, questionVersions: { createMany: { data: draft.questionVersionIds.map((questionVersionId) => ({ questionVersionId })) } } }, select: { id: true, revision: true } });
      await tx.auditEvent.create({ data: { actorId: input.actor.id, schoolId: group.schoolId, action: "ACTIVITY_CREATED", targetType: "Activity", targetId: activity.id, correlationId: input.correlationId ?? randomUUID(), after: { classId: group.id, targetCount: draft.targetCount, selectedVersions: draft.questionVersionIds.length } } });
      return activity;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) { mapWrite(error); }
}

async function teacherActivity(client: Prisma.TransactionClient | typeof prisma, actor: AuthenticatedPrincipal, activityId: string) {
  uuid(activityId, "Atividade inválida.");
  const activity = await client.activity.findUnique({ where: { id: activityId }, select: { id: true, schoolId: true, classId: true, teacherId: true, title: true, instructions: true, targetCount: true, status: true, revision: true, openedAt: true, closedAt: true, classGroup: { select: { name: true, grade: true, academicYear: { select: { year: true } } } } } });
  if (!activity) throw new AuthorizationError("NOT_FOUND", "Atividade não encontrada.");
  await assignedClass(client, actor, activity.classId, activity.schoolId);
  if (activity.teacherId !== actor.id) throw new AuthorizationError("FORBIDDEN", "A atividade pertence a outro professor.");
  return activity;
}

export async function updateActivity(input: { actor: AuthenticatedPrincipal; activityId: string; revision: number; title: string; instructions?: string | null; targetCount: number; questionVersionIds: string[]; correlationId?: string }) {
  validateRevision(input.revision); const draft = validateDraft(input);
  try {
    return await prisma.$transaction(async (tx) => {
      const before = await teacherActivity(tx, input.actor, input.activityId);
      if (before.status !== "DRAFT") throw new AuthorizationError("STATE_CONFLICT", "Somente rascunhos podem ser editados.");
      const versions = await eligibleVersions(tx, input.actor, before.classGroup.grade, draft.questionVersionIds);
      if (versions.length !== draft.questionVersionIds.length) throw new AuthorizationError("VALIDATION", "A seleção contém questão indisponível, de outra série ou privada de outro autor.");
      const changed = await tx.activity.updateMany({ where: { id: before.id, revision: input.revision, status: "DRAFT" }, data: { title: draft.title, instructions: draft.instructions, targetCount: draft.targetCount, revision: { increment: 1 } } });
      if (changed.count !== 1) throw new AuthorizationError("STATE_CONFLICT", "A atividade foi alterada por outra operação.");
      await tx.activityQuestionVersion.deleteMany({ where: { activityId: before.id } });
      if (draft.questionVersionIds.length) await tx.activityQuestionVersion.createMany({ data: draft.questionVersionIds.map((questionVersionId) => ({ activityId: before.id, questionVersionId })) });
      await tx.auditEvent.create({ data: { actorId: input.actor.id, schoolId: before.schoolId, action: "ACTIVITY_UPDATED", targetType: "Activity", targetId: before.id, correlationId: input.correlationId ?? randomUUID(), before: { revision: before.revision }, after: { revision: before.revision + 1, targetCount: draft.targetCount, selectedVersions: draft.questionVersionIds.length } } });
      return { id: before.id, revision: before.revision + 1 };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) { mapWrite(error); }
}

export async function listTeacherActivities(input: { actor: AuthenticatedPrincipal; schoolId: string }) {
  const options = await listActivityAuthoringOptions(input); const classIds = options.classes.map(({ id }) => id);
  return prisma.activity.findMany({ where: { teacherId: input.actor.id, schoolId: input.schoolId, classId: { in: classIds } }, select: { id: true, title: true, targetCount: true, status: true, revision: true, openedAt: true, closedAt: true, classGroup: { select: { name: true, grade: true } }, _count: { select: { questionVersions: true, participations: true } } }, orderBy: { createdAt: "desc" } });
}

export async function getTeacherActivity(input: { actor: AuthenticatedPrincipal; activityId: string }) {
  const activity = await teacherActivity(prisma, input.actor, input.activityId);
  const [selections, participations] = await Promise.all([
    prisma.activityQuestionVersion.findMany({ where: { activityId: activity.id }, select: { questionVersion: { select: { id: true, difficulty: true, grade: true, statement: true, versionNumber: true, theme: { select: { name: true } }, skill: { select: { name: true } }, question: { select: { origin: true, status: true, ownerId: true, latestVersionNumber: true } } } } }, orderBy: { questionVersion: { difficulty: "asc" } } }),
    prisma.activityParticipation.findMany({ where: { activityId: activity.id }, select: { acceptedAnswers: true, correctAnswers: true, incorrectAnswers: true, extraAnswers: true, targetReachedAt: true, student: { select: { id: true, name: true } } }, orderBy: { student: { name: "asc" } } }),
  ]);
  const versions = selections.map(({ questionVersion }) => questionVersion);
  return { ...activity, versions, coverage: coverageFor(versions), participations };
}

type LockedActivity = { id: string; status: "DRAFT" | "OPEN" | "CLOSED"; revision: number };
async function lockActivity(tx: Prisma.TransactionClient, id: string) {
  const rows = await tx.$queryRaw<LockedActivity[]>`SELECT "id", "status", "revision" FROM "Activity" WHERE "id" = ${id}::uuid FOR UPDATE`;
  if (!rows[0]) throw new AuthorizationError("NOT_FOUND", "Atividade não encontrada.");
  return rows[0];
}

export async function openActivity(input: { actor: AuthenticatedPrincipal; activityId: string; revision: number; correlationId?: string }) {
  uuid(input.activityId, "Atividade inválida."); validateRevision(input.revision);
  try {
    return await prisma.$transaction(async (tx) => {
      const locked = await lockActivity(tx, input.activityId);
      const activity = await teacherActivity(tx, input.actor, input.activityId);
      if (locked.status !== "DRAFT") throw new AuthorizationError("STATE_CONFLICT", "A atividade não está mais em rascunho.");
      if (locked.revision !== input.revision) throw new AuthorizationError("STATE_CONFLICT", "A atividade foi alterada por outra operação.");
      const selections = await tx.activityQuestionVersion.findMany({ where: { activityId: activity.id }, select: { questionVersionId: true } });
      const versions = await eligibleVersions(tx, input.actor, activity.classGroup.grade, selections.map(({ questionVersionId }) => questionVersionId));
      if (versions.length !== selections.length) throw new AuthorizationError("STATE_CONFLICT", "Há questões retiradas, desatualizadas ou inelegíveis na seleção.");
      const coverage = coverageFor(versions);
      if (!coverage.complete) throw new AuthorizationError("VALIDATION", `Inclua ao menos uma questão nas dificuldades: ${coverage.gaps.join(", ")}.`);
      const now = new Date();
      const enrollments = await tx.enrollment.findMany({ where: { classId: activity.classId, schoolId: activity.schoolId, status: "ACTIVE", ...activeWindow(now), student: { status: "ACTIVE", studentCode: { not: null }, globalRole: null } }, select: { id: true, studentId: true } });
      if (enrollments.length) await tx.activityParticipation.createMany({ data: enrollments.map(({ id, studentId }) => ({ activityId: activity.id, enrollmentId: id, studentId })), skipDuplicates: true });
      const opened = await tx.activity.update({ where: { id: activity.id }, data: { status: "OPEN", openedAt: now, revision: { increment: 1 } }, select: { id: true, status: true, revision: true, openedAt: true } });
      await tx.auditEvent.create({ data: { actorId: input.actor.id, schoolId: activity.schoolId, action: "ACTIVITY_OPENED", targetType: "Activity", targetId: activity.id, correlationId: input.correlationId ?? randomUUID(), before: { status: "DRAFT", revision: locked.revision }, after: { status: "OPEN", revision: opened.revision, recipients: enrollments.length, selectedVersions: versions.length } } });
      return opened;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10000, timeout: 15000 });
  } catch (error) { mapWrite(error); }
}

export async function closeActivity(input: { actor: AuthenticatedPrincipal; activityId: string; revision: number; correlationId?: string }) {
  uuid(input.activityId, "Atividade inválida."); validateRevision(input.revision);
  try {
    return await prisma.$transaction(async (tx) => {
      const locked = await lockActivity(tx, input.activityId);
      const activity = await teacherActivity(tx, input.actor, input.activityId);
      if (locked.status !== "OPEN") throw new AuthorizationError("STATE_CONFLICT", "A atividade não está aberta.");
      if (locked.revision !== input.revision) throw new AuthorizationError("STATE_CONFLICT", "A atividade foi alterada por outra operação.");
      const now = new Date();
      const closed = await tx.activity.update({ where: { id: activity.id }, data: { status: "CLOSED", closedAt: now, revision: { increment: 1 } }, select: { id: true, status: true, revision: true, closedAt: true } });
      await tx.auditEvent.create({ data: { actorId: input.actor.id, schoolId: activity.schoolId, action: "ACTIVITY_CLOSED", targetType: "Activity", targetId: activity.id, correlationId: input.correlationId ?? randomUUID(), before: { status: "OPEN", revision: locked.revision }, after: { status: "CLOSED", revision: closed.revision } } });
      return closed;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10000, timeout: 15000 });
  } catch (error) { mapWrite(error); }
}

export async function recordAcceptedAnswer(input: { activityId: string; studentId: string; clientActionId: string; outcome: "CORRECT" | "INCORRECT" }) {
  uuid(input.activityId, "Atividade inválida."); uuid(input.studentId, "Aluno inválido."); uuid(input.clientActionId, "Identificador de resposta inválido.");
  if (input.outcome !== "CORRECT" && input.outcome !== "INCORRECT") throw new AuthorizationError("VALIDATION", "Resultado de resposta inválido.");
  try {
    return await prisma.$transaction(async (tx) => {
      await lockActivity(tx, input.activityId);
      const participation = await tx.activityParticipation.findUnique({ where: { activityId_studentId: { activityId: input.activityId, studentId: input.studentId } }, select: { id: true, acceptedAnswers: true, correctAnswers: true, incorrectAnswers: true, extraAnswers: true, targetReachedAt: true, revision: true, activity: { select: { status: true, targetCount: true } } } });
      if (!participation) throw new AuthorizationError("NOT_FOUND", "Participação não encontrada.");
      const retry = await tx.activityAnswerReceipt.findUnique({ where: { participationId_clientActionId: { participationId: participation.id, clientActionId: input.clientActionId } }, select: { id: true, outcome: true, acceptedNumber: true, isExtra: true, acceptedAt: true } });
      if (retry) return { ...retry, retried: true };
      if (participation.activity.status !== "OPEN") throw new AuthorizationError("STATE_CONFLICT", "A atividade foi encerrada e não aceita novas respostas.");
      const acceptedNumber = participation.acceptedAnswers + 1;
      const isExtra = participation.acceptedAnswers >= participation.activity.targetCount;
      const acceptedAt = new Date();
      const receipt = await tx.activityAnswerReceipt.create({ data: { participationId: participation.id, clientActionId: input.clientActionId, outcome: input.outcome, acceptedNumber, isExtra, acceptedAt }, select: { id: true, outcome: true, acceptedNumber: true, isExtra: true, acceptedAt: true } });
      await tx.activityParticipation.update({ where: { id: participation.id }, data: { acceptedAnswers: { increment: 1 }, correctAnswers: input.outcome === "CORRECT" ? { increment: 1 } : undefined, incorrectAnswers: input.outcome === "INCORRECT" ? { increment: 1 } : undefined, extraAnswers: isExtra ? { increment: 1 } : undefined, targetReachedAt: !participation.targetReachedAt && acceptedNumber >= participation.activity.targetCount ? acceptedAt : undefined, revision: { increment: 1 } } });
      return { ...receipt, retried: false };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10000, timeout: 15000 });
  } catch (error) { mapWrite(error); }
}

export async function listStudentActivities(actor: AuthenticatedPrincipal) {
  if (!actor.studentCode || actor.globalRole) throw new AuthorizationError("FORBIDDEN", "Acesso exclusivo do aluno.");
  return prisma.activityParticipation.findMany({ where: { studentId: actor.id, activity: { status: { in: ["OPEN", "CLOSED"] } } }, select: { id: true, acceptedAnswers: true, correctAnswers: true, incorrectAnswers: true, extraAnswers: true, targetReachedAt: true, activity: { select: { id: true, title: true, instructions: true, targetCount: true, status: true, openedAt: true, closedAt: true, classGroup: { select: { name: true, grade: true } } } } }, orderBy: { activity: { openedAt: "desc" } } });
}

export async function getStudentActivity(input: { actor: AuthenticatedPrincipal; activityId: string }) {
  uuid(input.activityId, "Atividade inválida.");
  if (!input.actor.studentCode || input.actor.globalRole) throw new AuthorizationError("FORBIDDEN", "Acesso exclusivo do aluno.");
  const participation = await prisma.activityParticipation.findUnique({ where: { activityId_studentId: { activityId: input.activityId, studentId: input.actor.id } }, select: { id: true, acceptedAnswers: true, correctAnswers: true, incorrectAnswers: true, extraAnswers: true, targetReachedAt: true, activity: { select: { id: true, title: true, instructions: true, targetCount: true, status: true, openedAt: true, closedAt: true, classGroup: { select: { name: true, grade: true } } } } } });
  if (!participation) throw new AuthorizationError("NOT_FOUND", "Atividade não encontrada para este aluno.");
  return participation;
}
