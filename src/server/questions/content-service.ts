import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/src/lib/prisma";
import { AuthorizationError } from "@/src/server/auth/errors";
import type { AuthenticatedPrincipal } from "@/src/server/auth/policies";
import { questionMediaStore } from "./media";
import { assertQuestionAuthor, assertTaxonomy, clean, mapWrite, uuid } from "./service";

const MAX_IMAGE_BYTES = 512 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export type OptionInput = { stableId?: string | null; text: string; isCorrect: boolean };
export type MediaInput = { bytes: Uint8Array; mimeType: string; altText: string };
export type RichContentInput = {
  grade: number;
  difficulty: number;
  themeId: string;
  skillId?: string | null;
  statement: string;
  answerType: "MULTIPLE_CHOICE" | "NUMERIC";
  explanation?: string | null;
  numericExpected?: string | null;
  options?: OptionInput[];
  media?: MediaInput | null;
  removeMedia?: boolean;
  preservedAltText?: string | null;
};

function imageSignatureMatches(bytes: Uint8Array, mimeType: string) {
  if (mimeType === "image/png") return bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((value, index) => bytes[index] === value);
  if (mimeType === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === "image/gif") return bytes.length >= 6 && String.fromCharCode(...bytes.slice(0, 6)) .startsWith("GIF8");
  if (mimeType === "image/webp") return bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return false;
}

function normalizeDecimal(value: string) {
  const normalized = value.normalize("NFKC").trim().replace(",", ".");
  if (!/^[+-]?\d{1,12}(?:\.\d{1,6})?$/.test(normalized)) {
    throw new AuthorizationError("VALIDATION", "Informe somente um número decimal, com vírgula ou ponto e até 6 casas.");
  }
  return new Prisma.Decimal(normalized).toFixed(6);
}

export function validateRichContent(input: RichContentInput) {
  if (!Number.isInteger(input.grade) || input.grade < 1 || input.grade > 5) throw new AuthorizationError("VALIDATION", "Selecione uma série válida.");
  if (!Number.isInteger(input.difficulty) || input.difficulty < 1 || input.difficulty > 6) throw new AuthorizationError("VALIDATION", "Selecione uma dificuldade de 1 a 6.");
  uuid(input.themeId, "Tema inválido.");
  if (input.skillId) uuid(input.skillId, "Habilidade inválida.");
  const statement = clean(input.statement);
  if (statement.length < 5 || statement.length > 2000) throw new AuthorizationError("VALIDATION", "O enunciado deve ter de 5 a 2.000 caracteres.");
  const explanation = input.explanation ? clean(input.explanation) : null;
  if (explanation && explanation.length > 2000) throw new AuthorizationError("VALIDATION", "A explicação deve ter até 2.000 caracteres.");

  let numericExpected: string | null = null;
  let options: Array<{ stableId: string; text: string; isCorrect: boolean; position: number }> = [];
  if (input.answerType === "MULTIPLE_CHOICE") {
    if (!input.options || input.options.length < 2 || input.options.length > 6) throw new AuthorizationError("VALIDATION", "Cadastre de 2 a 6 alternativas.");
    options = input.options.map((option, position) => {
      const text = clean(option.text);
      if (text.length < 1 || text.length > 500) throw new AuthorizationError("VALIDATION", "Cada alternativa deve ter de 1 a 500 caracteres.");
      const stableId = option.stableId || randomUUID(); uuid(stableId, "Identificador de alternativa inválido.");
      return { stableId, text, isCorrect: option.isCorrect, position };
    });
    if (new Set(options.map(({ stableId }) => stableId)).size !== options.length) throw new AuthorizationError("VALIDATION", "As alternativas devem ter identificadores únicos.");
    if (options.filter(({ isCorrect }) => isCorrect).length !== 1) throw new AuthorizationError("VALIDATION", "Marque exatamente uma alternativa correta.");
  } else if (input.answerType === "NUMERIC") {
    if (!input.numericExpected) throw new AuthorizationError("VALIDATION", "Informe a resposta numérica esperada.");
    numericExpected = normalizeDecimal(input.numericExpected);
  } else {
    throw new AuthorizationError("VALIDATION", "Tipo de resposta inválido.");
  }

  let media: (MediaInput & { contentHash: string }) | null = null;
  if (input.media) {
    const mimeType = input.media.mimeType.toLowerCase();
    const altText = clean(input.media.altText);
    if (!ALLOWED_IMAGE_TYPES.has(mimeType) || input.media.bytes.length < 1 || input.media.bytes.length > MAX_IMAGE_BYTES || !imageSignatureMatches(input.media.bytes, mimeType)) {
      throw new AuthorizationError("VALIDATION", "Envie uma imagem PNG, JPEG, WebP ou GIF válida de até 512 KB.");
    }
    if (altText.length < 3 || altText.length > 300) throw new AuthorizationError("VALIDATION", "A descrição da imagem deve ter de 3 a 300 caracteres.");
    media = { ...input.media, mimeType, altText, contentHash: createHash("sha256").update(input.media.bytes).digest("hex") };
  }

  const canonical = { grade: input.grade, difficulty: input.difficulty, themeId: input.themeId, skillId: input.skillId || null, statement, answerType: input.answerType, explanation, numericExpected, options: options.map(({ stableId, text, isCorrect, position }) => ({ stableId, text, isCorrect, position })), mediaHash: media?.contentHash ?? null, mediaAltText: media?.altText ?? null };
  return { ...canonical, media, contentHash: createHash("sha256").update(JSON.stringify(canonical)).digest("hex") };
}

export async function createContentVersionRecord(tx: Prisma.TransactionClient, input: ReturnType<typeof validateRichContent> & { questionId: string; versionNumber: number; createdById: string; fallbackMedia?: { mimeType: string; altText: string; bytes: Uint8Array; contentHash: string } | null }) {
  const version = await tx.questionVersion.create({ data: { questionId: input.questionId, versionNumber: input.versionNumber, grade: input.grade, difficulty: input.difficulty, themeId: input.themeId, skillId: input.skillId, statement: input.statement, answerType: input.answerType, explanation: input.explanation, numericExpected: input.numericExpected, contentHash: input.contentHash, createdById: input.createdById }, select: { id: true, versionNumber: true } });
  if (input.options.length) await tx.questionOption.createMany({ data: input.options.map((option) => ({ versionId: version.id, ...option })) });
  const media = input.media ?? input.fallbackMedia;
  if (media) await questionMediaStore.writeImage(tx, { versionId: version.id, ...media });
  return version;
}

export async function createRichQuestion(input: { actor: AuthenticatedPrincipal; content: RichContentInput; correlationId?: string }) {
  const origin = await assertQuestionAuthor(input.actor); const content = validateRichContent(input.content);
  try {
    return await prisma.$transaction(async (tx) => {
      await assertTaxonomy(tx, content.themeId, content.skillId);
      const question = await tx.question.create({ data: { origin, ownerId: origin === "PRIVATE" ? input.actor.id : null, createdById: input.actor.id }, select: { id: true, revision: true } });
      const version = await createContentVersionRecord(tx, { ...content, questionId: question.id, versionNumber: 1, createdById: input.actor.id });
      await tx.auditEvent.create({ data: { actorId: input.actor.id, action: "RICH_QUESTION_CREATED", targetType: "Question", targetId: question.id, correlationId: input.correlationId ?? randomUUID(), after: { origin, versionId: version.id, answerType: content.answerType, grade: content.grade, difficulty: content.difficulty, hasMedia: Boolean(content.media) } } });
      return { ...question, versionId: version.id };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) { mapWrite(error); }
}

export async function createRichVersion(input: { actor: AuthenticatedPrincipal; questionId: string; revision: number; content: RichContentInput; correlationId?: string }) {
  await assertQuestionAuthor(input.actor); uuid(input.questionId, "Questão inválida.");
  if (!Number.isInteger(input.revision) || input.revision < 1) throw new AuthorizationError("VALIDATION", "Revisão inválida.");
  const content = validateRichContent(input.content);
  try {
    return await prisma.$transaction(async (tx) => {
      const question = await tx.question.findFirst({ where: { id: input.questionId, status: "ACTIVE", OR: input.actor.globalRole === "SEMED_ADMIN" ? [{ origin: "SEMED" }] : [{ origin: "PRIVATE", ownerId: input.actor.id }] }, select: { id: true, revision: true, latestVersionNumber: true } });
      if (!question) throw new AuthorizationError("NOT_FOUND", "Questão não encontrada.");
      await assertTaxonomy(tx, content.themeId, content.skillId);
      const changed = await tx.question.updateMany({ where: { id: question.id, revision: input.revision }, data: { revision: { increment: 1 }, latestVersionNumber: { increment: 1 } } });
      if (changed.count !== 1) throw new AuthorizationError("STATE_CONFLICT", "A questão foi alterada por outra operação.");
      const previousMedia = !content.media && !input.content.removeMedia ? await questionMediaStore.findVersionImage(tx, { questionId: question.id, versionNumber: question.latestVersionNumber }) : null;
      const preservedAltText = input.content.preservedAltText ? clean(input.content.preservedAltText) : previousMedia?.altText;
      if (previousMedia && (!preservedAltText || preservedAltText.length < 3 || preservedAltText.length > 300)) throw new AuthorizationError("VALIDATION", "A descrição da imagem deve ter de 3 a 300 caracteres.");
      const versionContent = previousMedia && !content.media ? { ...content, contentHash: createHash("sha256").update(`${content.contentHash}:${previousMedia.contentHash}:${preservedAltText}`).digest("hex") } : content;
      const version = await createContentVersionRecord(tx, { ...versionContent, questionId: question.id, versionNumber: question.latestVersionNumber + 1, createdById: input.actor.id, fallbackMedia: previousMedia ? { ...previousMedia, altText: preservedAltText! } : null });
      await tx.auditEvent.create({ data: { actorId: input.actor.id, action: "RICH_QUESTION_VERSION_CREATED", targetType: "Question", targetId: question.id, correlationId: input.correlationId ?? randomUUID(), before: { versionNumber: question.latestVersionNumber, revision: question.revision }, after: { versionId: version.id, versionNumber: version.versionNumber, revision: question.revision + 1, answerType: content.answerType, hasMedia: Boolean(content.media ?? previousMedia) } } });
      return { id: question.id, revision: question.revision + 1, versionNumber: version.versionNumber, versionId: version.id };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) { mapWrite(error); }
}

async function visibleVersion(actor: AuthenticatedPrincipal, versionId: string, includeAnswers: boolean) {
  await assertQuestionAuthor(actor); uuid(versionId, "Versão inválida.");
  const visibility = actor.globalRole === "SEMED_ADMIN" ? [{ origin: "SEMED" as const }, { origin: "PRIVATE" as const, versions: { some: { submissions: { some: {} } } } }] : [{ origin: "SEMED" as const }, { origin: "PRIVATE" as const, ownerId: actor.id }];
  const version = await prisma.questionVersion.findFirst({ where: { id: versionId, question: { OR: visibility } }, select: { id: true, statement: true, answerType: true, explanation: includeAnswers, numericExpected: includeAnswers, options: { orderBy: { position: "asc" }, select: { stableId: true, text: true, position: true, isCorrect: includeAnswers } }, media: { where: { kind: "IMAGE" }, select: { id: true, altText: true } }, question: { select: { id: true, origin: true } } } });
  if (!version || !version.answerType) throw new AuthorizationError("NOT_FOUND", "Versão utilizável não encontrada.");
  return version;
}

export async function getChallengePreview(input: { actor: AuthenticatedPrincipal; versionId: string }) {
  const version = await visibleVersion(input.actor, input.versionId, false);
  const answerType = version.answerType;
  if (!answerType) throw new AuthorizationError("NOT_FOUND", "Versão utilizável não encontrada.");
  return { id: version.id, statement: version.statement, answerType, options: version.options.map(({ stableId, text, position }) => ({ id: stableId, text, position })), image: version.media[0] ? { url: `/api/questoes/midia/${version.media[0].id}`, altText: version.media[0].altText } : null };
}

export async function correctPreviewAnswer(input: { actor: AuthenticatedPrincipal; versionId: string; answer: string }) {
  const version = await visibleVersion(input.actor, input.versionId, true);
  const answer = input.answer.normalize("NFKC").trim(); if (!answer) throw new AuthorizationError("VALIDATION", "Informe uma resposta.");
  if (version.answerType === "MULTIPLE_CHOICE") {
    const selected = version.options.find(({ stableId }) => stableId === answer); if (!selected) throw new AuthorizationError("VALIDATION", "Alternativa inválida.");
    const correct = version.options.find(({ isCorrect }) => isCorrect); if (!correct) throw new AuthorizationError("STATE_CONFLICT", "A questão não possui gabarito utilizável.");
    return { correct: selected.stableId === correct.stableId, correctAnswer: correct.text, explanation: version.explanation };
  }
  const received = normalizeDecimal(answer); const expected = version.numericExpected?.toFixed(6); if (!expected) throw new AuthorizationError("STATE_CONFLICT", "A questão não possui gabarito utilizável.");
  return { correct: received === expected, correctAnswer: expected.replace(/\.?0+$/, ""), explanation: version.explanation };
}

export async function getAuthorizedMedia(input: { actor: AuthenticatedPrincipal; mediaId: string }) {
  await assertQuestionAuthor(input.actor); uuid(input.mediaId, "Mídia inválida.");
  const visibility = input.actor.globalRole === "SEMED_ADMIN" ? [{ origin: "SEMED" as const }, { origin: "PRIVATE" as const, versions: { some: { submissions: { some: {} } } } }] : [{ origin: "SEMED" as const }, { origin: "PRIVATE" as const, ownerId: input.actor.id }];
  const authorized = await prisma.questionMedia.findFirst({ where: { id: input.mediaId, version: { question: { OR: visibility } } }, select: { id: true } });
  if (!authorized) throw new AuthorizationError("NOT_FOUND", "Mídia não encontrada.");
  const media = await questionMediaStore.readImage(authorized.id);
  if (!media) throw new AuthorizationError("NOT_FOUND", "Mídia não encontrada.");
  return media;
}
