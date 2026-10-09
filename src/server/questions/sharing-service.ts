import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/src/lib/prisma";
import { AuthorizationError } from "@/src/server/auth/errors";
import { assertGlobalRole, type AuthenticatedPrincipal } from "@/src/server/auth/policies";
import { assertQuestionAuthor, clean, mapWrite, uuid } from "./service";

type Decision = "CHANGES_REQUESTED" | "REJECTED" | "APPROVED_PUBLISHED";

function validateRevision(revision: number) {
  if (!Number.isInteger(revision) || revision < 1) throw new AuthorizationError("VALIDATION", "Revisão inválida.");
}

function validateNote(status: Decision, value?: string | null) {
  const note = value ? clean(value) : null;
  if ((status === "CHANGES_REQUESTED" || status === "REJECTED") && (!note || note.length < 3)) throw new AuthorizationError("VALIDATION", "Informe uma justificativa com ao menos 3 caracteres.");
  if (note && note.length > 1000) throw new AuthorizationError("VALIDATION", "A observação deve ter até 1.000 caracteres.");
  return note;
}

export async function submitQuestionVersion(input: { actor: AuthenticatedPrincipal; versionId: string; correlationId?: string }) {
  const origin = await assertQuestionAuthor(input.actor); if (origin !== "PRIVATE") throw new AuthorizationError("FORBIDDEN", "Somente professores enviam questões particulares para análise.");
  uuid(input.versionId, "Versão inválida.");
  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.questionSubmission.findUnique({ where: { sourceVersionId: input.versionId }, select: { id: true, status: true, revision: true, sourceVersionId: true } });
      if (existing) {
        const source = await tx.questionVersion.findFirst({ where: { id: input.versionId, question: { origin: "PRIVATE", ownerId: input.actor.id } }, select: { id: true } });
        if (!source) throw new AuthorizationError("NOT_FOUND", "Versão não encontrada.");
        return existing;
      }
      const source = await tx.questionVersion.findFirst({ where: { id: input.versionId, answerType: { not: null }, question: { origin: "PRIVATE", ownerId: input.actor.id, status: "ACTIVE" } }, select: { id: true, questionId: true, versionNumber: true } });
      if (!source) throw new AuthorizationError("NOT_FOUND", "Versão utilizável não encontrada.");
      const submission = await tx.questionSubmission.create({ data: { sourceVersionId: source.id, submitterId: input.actor.id }, select: { id: true, status: true, revision: true, sourceVersionId: true } });
      await tx.auditEvent.create({ data: { actorId: input.actor.id, action: "QUESTION_SUBMITTED", targetType: "QuestionSubmission", targetId: submission.id, correlationId: input.correlationId ?? randomUUID(), after: { sourceVersionId: source.id, questionId: source.questionId, versionNumber: source.versionNumber, status: submission.status } } });
      return submission;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) { mapWrite(error); }
}

export async function listOwnSubmissions(actor: AuthenticatedPrincipal) {
  const origin = await assertQuestionAuthor(actor); if (origin !== "PRIVATE") throw new AuthorizationError("FORBIDDEN", "Acesso não autorizado.");
  return prisma.questionSubmission.findMany({ where: { submitterId: actor.id }, select: { id: true, status: true, revision: true, decisionNote: true, submittedAt: true, decidedAt: true, sourceVersion: { select: { id: true, questionId: true, versionNumber: true, statement: true } }, publishedQuestionId: true }, orderBy: { submittedAt: "desc" } });
}

export async function listReviewQueue(actor: AuthenticatedPrincipal) {
  assertGlobalRole(actor, ["SEMED_ADMIN"]);
  return prisma.questionSubmission.findMany({ select: { id: true, status: true, revision: true, decisionNote: true, submittedAt: true, reviewStartedAt: true, decidedAt: true, sourceVersion: { select: { id: true, questionId: true, versionNumber: true, statement: true, answerType: true, grade: true, difficulty: true, theme: { select: { name: true } }, skill: { select: { name: true } } } }, submitter: { select: { name: true } }, reviewer: { select: { name: true } }, publishedQuestionId: true }, orderBy: [{ status: "asc" }, { submittedAt: "asc" }] });
}

export async function startSubmissionReview(input: { actor: AuthenticatedPrincipal; submissionId: string; revision: number; correlationId?: string }) {
  assertGlobalRole(input.actor, ["SEMED_ADMIN"]); uuid(input.submissionId, "Envio inválido."); validateRevision(input.revision);
  try {
    return await prisma.$transaction(async (tx) => {
      const current = await tx.questionSubmission.findUnique({ where: { id: input.submissionId }, select: { id: true, status: true, revision: true, reviewerId: true } });
      if (!current) throw new AuthorizationError("NOT_FOUND", "Envio não encontrado.");
      if (current.status === "UNDER_REVIEW" && current.reviewerId === input.actor.id) return current;
      if (current.status !== "SUBMITTED") throw new AuthorizationError("STATE_CONFLICT", "Este envio não pode mais entrar em análise.");
      const changed = await tx.questionSubmission.updateMany({ where: { id: current.id, revision: input.revision, status: "SUBMITTED" }, data: { status: "UNDER_REVIEW", reviewerId: input.actor.id, reviewStartedAt: new Date(), revision: { increment: 1 } } });
      if (changed.count !== 1) throw new AuthorizationError("STATE_CONFLICT", "O envio foi alterado por outra operação.");
      const result = await tx.questionSubmission.findUniqueOrThrow({ where: { id: current.id }, select: { id: true, status: true, revision: true, reviewerId: true } });
      await tx.auditEvent.create({ data: { actorId: input.actor.id, action: "QUESTION_REVIEW_STARTED", targetType: "QuestionSubmission", targetId: current.id, correlationId: input.correlationId ?? randomUUID(), before: { status: current.status, revision: current.revision }, after: { status: result.status, revision: result.revision } } });
      return result;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) { mapWrite(error); }
}

export async function decideSubmission(input: { actor: AuthenticatedPrincipal; submissionId: string; revision: number; decision: Decision; note?: string | null; correlationId?: string }) {
  assertGlobalRole(input.actor, ["SEMED_ADMIN"]); uuid(input.submissionId, "Envio inválido."); validateRevision(input.revision); const note = validateNote(input.decision, input.note);
  try {
    return await prisma.$transaction(async (tx) => {
      const current = await tx.questionSubmission.findUnique({ where: { id: input.submissionId }, select: { id: true, status: true, revision: true, reviewerId: true, decisionNote: true, publishedQuestionId: true, publishedVersionId: true, sourceVersion: { select: { id: true, questionId: true, grade: true, difficulty: true, themeId: true, skillId: true, statement: true, answerType: true, explanation: true, numericExpected: true, contentHash: true, options: { orderBy: { position: "asc" } }, media: { where: { kind: "IMAGE" } }, question: { select: { ownerId: true, origin: true } } } } } });
      if (!current) throw new AuthorizationError("NOT_FOUND", "Envio não encontrado.");
      if (["CHANGES_REQUESTED", "REJECTED", "APPROVED_PUBLISHED"].includes(current.status)) {
        if (current.status === input.decision) return { id: current.id, status: current.status, revision: current.revision, publishedQuestionId: current.publishedQuestionId, publishedVersionId: current.publishedVersionId };
        throw new AuthorizationError("STATE_CONFLICT", "Este envio já recebeu outra decisão.");
      }
      if (current.revision !== input.revision) throw new AuthorizationError("STATE_CONFLICT", "O envio foi alterado por outra operação.");
      if (!current.sourceVersion.answerType || current.sourceVersion.question.origin !== "PRIVATE" || !current.sourceVersion.question.ownerId) throw new AuthorizationError("STATE_CONFLICT", "A versão enviada não é publicável.");
      let publishedQuestionId: string | null = null; let publishedVersionId: string | null = null;
      if (input.decision === "APPROVED_PUBLISHED") {
        const published = await tx.question.create({ data: { origin: "SEMED", createdById: input.actor.id, sourceQuestionId: current.sourceVersion.questionId, sourceVersionId: current.sourceVersion.id }, select: { id: true } });
        const version = await tx.questionVersion.create({ data: { questionId: published.id, versionNumber: 1, grade: current.sourceVersion.grade, difficulty: current.sourceVersion.difficulty, themeId: current.sourceVersion.themeId, skillId: current.sourceVersion.skillId, statement: current.sourceVersion.statement, answerType: current.sourceVersion.answerType, explanation: current.sourceVersion.explanation, numericExpected: current.sourceVersion.numericExpected, contentHash: current.sourceVersion.contentHash, createdById: input.actor.id }, select: { id: true } });
        if (current.sourceVersion.options.length) await tx.questionOption.createMany({ data: current.sourceVersion.options.map(({ stableId, text, position, isCorrect }) => ({ versionId: version.id, stableId, text, position, isCorrect })) });
        for (const media of current.sourceVersion.media) await tx.questionMedia.create({ data: { versionId: version.id, kind: media.kind, mimeType: media.mimeType, byteSize: media.byteSize, altText: media.altText, contentHash: media.contentHash, bytes: new Uint8Array(media.bytes) } });
        publishedQuestionId = published.id; publishedVersionId = version.id;
      }
      const decidedAt = new Date();
      const changed = await tx.questionSubmission.updateMany({ where: { id: current.id, revision: current.revision, status: { in: ["SUBMITTED", "UNDER_REVIEW"] } }, data: { status: input.decision, reviewerId: input.actor.id, decisionNote: note, decidedAt, reviewStartedAt: current.status === "SUBMITTED" ? decidedAt : undefined, publishedQuestionId, publishedVersionId, revision: { increment: 1 } } });
      if (changed.count !== 1) throw new AuthorizationError("STATE_CONFLICT", "Outra decisão venceu esta operação.");
      const result = { id: current.id, status: input.decision, revision: current.revision + 1, publishedQuestionId, publishedVersionId };
      await tx.auditEvent.create({ data: { actorId: input.actor.id, action: "QUESTION_SUBMISSION_DECIDED", targetType: "QuestionSubmission", targetId: current.id, correlationId: input.correlationId ?? randomUUID(), before: { status: current.status, revision: current.revision }, after: { ...result, noteProvided: Boolean(note) } } });
      return result;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) { mapWrite(error); }
}
