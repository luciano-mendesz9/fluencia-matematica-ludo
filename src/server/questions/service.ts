import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/src/lib/prisma";
import { AuthorizationError } from "@/src/server/auth/errors";
import { assertGlobalRole, type AuthenticatedPrincipal } from "@/src/server/auth/policies";

export function clean(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ");
}

function normalized(value: string) {
  return clean(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

export function uuid(value: string, message: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new AuthorizationError("VALIDATION", message);
  }
}

function validateVersion(input: { grade: number; difficulty: number; themeId: string; skillId?: string | null; statement: string }) {
  if (!Number.isInteger(input.grade) || input.grade < 1 || input.grade > 5) throw new AuthorizationError("VALIDATION", "Selecione uma série válida.");
  if (!Number.isInteger(input.difficulty) || input.difficulty < 1 || input.difficulty > 6) throw new AuthorizationError("VALIDATION", "Selecione uma dificuldade de 1 a 6.");
  uuid(input.themeId, "Tema inválido.");
  if (input.skillId) uuid(input.skillId, "Habilidade inválida.");
  const statement = clean(input.statement);
  if (statement.length < 5 || statement.length > 2000) throw new AuthorizationError("VALIDATION", "O enunciado deve ter de 5 a 2.000 caracteres.");
  return { ...input, statement, skillId: input.skillId || null };
}

export async function assertQuestionAuthor(actor: AuthenticatedPrincipal) {
  if (actor.studentCode || actor.globalRole === "DEVELOPER") throw new AuthorizationError("FORBIDDEN", "Acesso não autorizado.");
  if (actor.globalRole === "SEMED_ADMIN") return "SEMED" as const;
  if (actor.globalRole) throw new AuthorizationError("FORBIDDEN", "Acesso não autorizado.");
  const now = new Date();
  const assignment = await prisma.teacherClassAssignment.findFirst({
    where: {
      teacherId: actor.id, status: "ACTIVE", startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      teacher: { status: "ACTIVE", globalRole: null, studentCode: null }, school: { status: "ACTIVE" },
      classGroup: { status: "ACTIVE", academicYear: { status: "ACTIVE" } },
      membership: { role: "TEACHER", status: "ACTIVE", startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
    }, select: { id: true },
  });
  if (!assignment) throw new AuthorizationError("FORBIDDEN", "É necessária uma turma atribuída e vigente para acessar o banco de questões.");
  return "PRIVATE" as const;
}

export async function assertTaxonomy(client: Prisma.TransactionClient | typeof prisma, themeId: string, skillId?: string | null) {
  const theme = await client.theme.findFirst({ where: { id: themeId, status: "ACTIVE" }, select: { id: true } });
  if (!theme) throw new AuthorizationError("VALIDATION", "Tema indisponível.");
  if (skillId) {
    const skill = await client.skill.findFirst({ where: { id: skillId, themeId, status: "ACTIVE" }, select: { id: true } });
    if (!skill) throw new AuthorizationError("VALIDATION", "A habilidade não pertence ao tema selecionado ou está inativa.");
  }
}

function hashVersion(input: { grade: number; difficulty: number; themeId: string; skillId: string | null; statement: string }) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

export function mapWrite(error: unknown): never {
  if (error instanceof AuthorizationError) throw error;
  if (typeof error === "object" && error && "code" in error && (error.code === "P2002" || error.code === "P2034")) {
    throw new AuthorizationError("STATE_CONFLICT", "Os dados foram alterados por outra operação. Atualize a página e tente novamente.");
  }
  throw error;
}

export async function listTaxonomy(actor: AuthenticatedPrincipal) {
  await assertQuestionAuthor(actor);
  return prisma.theme.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true, skills: { where: { status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });
}

export async function createTheme(input: { actor: AuthenticatedPrincipal; name: string; correlationId?: string }) {
  assertGlobalRole(input.actor, ["SEMED_ADMIN"]);
  const name = clean(input.name);
  if (name.length < 2 || name.length > 120) throw new AuthorizationError("VALIDATION", "Informe um tema com 2 a 120 caracteres.");
  try {
    return await prisma.$transaction(async (tx) => {
      const theme = await tx.theme.create({ data: { name, normalizedName: normalized(name) }, select: { id: true, name: true } });
      await tx.auditEvent.create({ data: { actorId: input.actor.id, action: "THEME_CREATED", targetType: "Theme", targetId: theme.id, correlationId: input.correlationId ?? randomUUID(), after: { name } } });
      return theme;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) { mapWrite(error); }
}

export async function createSkill(input: { actor: AuthenticatedPrincipal; themeId: string; name: string; correlationId?: string }) {
  assertGlobalRole(input.actor, ["SEMED_ADMIN"]); uuid(input.themeId, "Tema inválido.");
  const name = clean(input.name);
  if (name.length < 2 || name.length > 160) throw new AuthorizationError("VALIDATION", "Informe uma habilidade com 2 a 160 caracteres.");
  try {
    return await prisma.$transaction(async (tx) => {
      await assertTaxonomy(tx, input.themeId);
      const skill = await tx.skill.create({ data: { themeId: input.themeId, name, normalizedName: normalized(name) }, select: { id: true, name: true } });
      await tx.auditEvent.create({ data: { actorId: input.actor.id, action: "SKILL_CREATED", targetType: "Skill", targetId: skill.id, correlationId: input.correlationId ?? randomUUID(), after: { name, themeId: input.themeId } } });
      return skill;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) { mapWrite(error); }
}

export async function createQuestion(input: { actor: AuthenticatedPrincipal; grade: number; difficulty: number; themeId: string; skillId?: string | null; statement: string; correlationId?: string }) {
  const origin = await assertQuestionAuthor(input.actor);
  const version = validateVersion(input);
  try {
    return await prisma.$transaction(async (tx) => {
      await assertTaxonomy(tx, version.themeId, version.skillId);
      const question = await tx.question.create({ data: { origin, ownerId: origin === "PRIVATE" ? input.actor.id : null, createdById: input.actor.id }, select: { id: true, revision: true } });
      await tx.questionVersion.create({ data: { questionId: question.id, versionNumber: 1, grade: version.grade, difficulty: version.difficulty, themeId: version.themeId, skillId: version.skillId, statement: version.statement, contentHash: hashVersion(version), createdById: input.actor.id } });
      await tx.auditEvent.create({ data: { actorId: input.actor.id, action: "QUESTION_CREATED", targetType: "Question", targetId: question.id, correlationId: input.correlationId ?? randomUUID(), after: { origin, versionNumber: 1, grade: version.grade, difficulty: version.difficulty, themeId: version.themeId, skillId: version.skillId } } });
      return question;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) { mapWrite(error); }
}

export async function createVersion(input: { actor: AuthenticatedPrincipal; questionId: string; revision: number; grade: number; difficulty: number; themeId: string; skillId?: string | null; statement: string; correlationId?: string }) {
  await assertQuestionAuthor(input.actor); uuid(input.questionId, "Questão inválida.");
  if (!Number.isInteger(input.revision) || input.revision < 1) throw new AuthorizationError("VALIDATION", "Revisão inválida.");
  const version = validateVersion(input);
  try {
    return await prisma.$transaction(async (tx) => {
      const question = await tx.question.findFirst({ where: { id: input.questionId, status: "ACTIVE", OR: input.actor.globalRole === "SEMED_ADMIN" ? [{ origin: "SEMED" }] : [{ origin: "PRIVATE", ownerId: input.actor.id }] }, select: { id: true, revision: true, latestVersionNumber: true, origin: true } });
      if (!question) throw new AuthorizationError("NOT_FOUND", "Questão não encontrada.");
      await assertTaxonomy(tx, version.themeId, version.skillId);
      const changed = await tx.question.updateMany({ where: { id: question.id, revision: input.revision }, data: { revision: { increment: 1 }, latestVersionNumber: { increment: 1 } } });
      if (changed.count !== 1) throw new AuthorizationError("STATE_CONFLICT", "A questão foi alterada por outra operação.");
      const next = question.latestVersionNumber + 1;
      await tx.questionVersion.create({ data: { questionId: question.id, versionNumber: next, grade: version.grade, difficulty: version.difficulty, themeId: version.themeId, skillId: version.skillId, statement: version.statement, contentHash: hashVersion(version), createdById: input.actor.id } });
      await tx.auditEvent.create({ data: { actorId: input.actor.id, action: "QUESTION_VERSION_CREATED", targetType: "Question", targetId: question.id, correlationId: input.correlationId ?? randomUUID(), before: { versionNumber: question.latestVersionNumber, revision: question.revision }, after: { versionNumber: next, revision: question.revision + 1, grade: version.grade, difficulty: version.difficulty, themeId: version.themeId, skillId: version.skillId } } });
      return { id: question.id, revision: question.revision + 1, versionNumber: next };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) { mapWrite(error); }
}

export async function updateQuestionStatus(input: { actor: AuthenticatedPrincipal; questionId: string; revision: number; status: "ACTIVE" | "ARCHIVED"; correlationId?: string }) {
  await assertQuestionAuthor(input.actor); uuid(input.questionId, "Questão inválida.");
  if (!Number.isInteger(input.revision) || input.revision < 1) throw new AuthorizationError("VALIDATION", "Revisão inválida.");
  try {
    return await prisma.$transaction(async (tx) => {
      const question = await tx.question.findFirst({
        where: { id: input.questionId, OR: input.actor.globalRole === "SEMED_ADMIN" ? [{ origin: "SEMED" }] : [{ origin: "PRIVATE", ownerId: input.actor.id }] },
        select: { id: true, origin: true, status: true, revision: true },
      });
      if (!question) throw new AuthorizationError("NOT_FOUND", "Questão não encontrada.");
      const changed = await tx.question.updateMany({ where: { id: question.id, revision: input.revision }, data: { status: input.status, revision: { increment: 1 } } });
      if (changed.count !== 1) throw new AuthorizationError("STATE_CONFLICT", "A questão foi alterada por outra operação.");
      await tx.auditEvent.create({ data: { actorId: input.actor.id, action: "QUESTION_STATUS_UPDATED", targetType: "Question", targetId: question.id, correlationId: input.correlationId ?? randomUUID(), before: { status: question.status, revision: question.revision }, after: { status: input.status, revision: question.revision + 1 } } });
      return { id: question.id, status: input.status, revision: question.revision + 1 };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) { mapWrite(error); }
}

export async function listEligibleQuestions(input: { actor: AuthenticatedPrincipal; grade?: number; difficulty?: number; themeId?: string; origin?: "SEMED" | "PRIVATE"; status?: "ACTIVE" | "ARCHIVED" }) {
  await assertQuestionAuthor(input.actor);
  const questions = await prisma.question.findMany({
    where: { status: input.status ?? "ACTIVE", ...(input.origin ? { origin: input.origin } : {}), OR: [{ origin: "SEMED" }, { origin: "PRIVATE", ownerId: input.actor.id }] },
    select: { id: true, origin: true, status: true, revision: true, latestVersionNumber: true, versions: { orderBy: { versionNumber: "desc" }, take: 1, select: { versionNumber: true, grade: true, difficulty: true, statement: true, contentHash: true, theme: { select: { id: true, name: true } }, skill: { select: { id: true, name: true } } } } },
    orderBy: { updatedAt: "desc" },
  });
  return questions.filter(({ versions: [version] }) => version && (!input.grade || version.grade === input.grade) && (!input.difficulty || version.difficulty === input.difficulty) && (!input.themeId || version.theme.id === input.themeId));
}

export async function getEligibleQuestion(input: { actor: AuthenticatedPrincipal; questionId: string }) {
  await assertQuestionAuthor(input.actor); uuid(input.questionId, "Questão inválida.");
  const visibility = input.actor.globalRole === "SEMED_ADMIN" ? [{ origin: "SEMED" as const }, { origin: "PRIVATE" as const, versions: { some: { submissions: { some: {} } } } }] : [{ origin: "SEMED" as const }, { origin: "PRIVATE" as const, ownerId: input.actor.id }];
  const question = await prisma.question.findFirst({ where: { id: input.questionId, OR: visibility }, select: { id: true, origin: true, status: true, revision: true, latestVersionNumber: true, sourceQuestionId: true, sourceVersionId: true, versions: { orderBy: { versionNumber: "desc" }, select: { id: true, versionNumber: true, grade: true, difficulty: true, statement: true, answerType: true, explanation: true, numericExpected: true, contentHash: true, createdAt: true, theme: { select: { id: true, name: true } }, skill: { select: { id: true, name: true } }, options: { orderBy: { position: "asc" }, select: { stableId: true, text: true, position: true, isCorrect: true } }, media: { where: { kind: "IMAGE" }, select: { id: true, altText: true, mimeType: true, byteSize: true } }, submissions: { select: { id: true, status: true, revision: true, decisionNote: true, submittedAt: true, decidedAt: true, publishedQuestionId: true } } } } } });
  if (!question) throw new AuthorizationError("NOT_FOUND", "Questão não encontrada.");
  return { ...question, versions: question.versions.map((version) => ({ ...version, numericExpected: version.numericExpected?.toString() ?? null })) };
}
