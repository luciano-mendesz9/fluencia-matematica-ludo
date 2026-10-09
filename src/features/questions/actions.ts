"use server";

import { revalidatePath } from "next/cache";
import { AuthorizationError } from "@/src/server/auth/errors";
import { requireUser } from "@/src/server/auth/policies";
import { createQuestion, createSkill, createTheme, createVersion, updateQuestionStatus } from "@/src/server/questions/service";
import { correctPreviewAnswer, createRichQuestion, createRichVersion, type MediaInput, type RichContentInput } from "@/src/server/questions/content-service";
import { decideSubmission, startSubmissionReview, submitQuestionVersion } from "@/src/server/questions/sharing-service";
import { createQuestionSchema, createSkillSchema, createThemeSchema, createVersionSchema, decideSubmissionSchema, previewAnswerSchema, richQuestionScalarSchema, startReviewSchema, submitQuestionSchema, updateQuestionStatusSchema } from "./schemas";

export type QuestionActionState = { status: "idle" | "success" | "error"; message?: string; createdId?: string; correction?: { correct: boolean; correctAnswer: string; explanation: string | null } };

function errorState(error: unknown, fallback: string): QuestionActionState {
  return { status: "error", message: error instanceof AuthorizationError ? error.message : fallback };
}

export async function createThemeAction(_state: QuestionActionState, data: FormData): Promise<QuestionActionState> {
  const parsed = createThemeSchema.safeParse({ name: data.get("name") });
  if (!parsed.success) return { status: "error", message: "Informe um nome de tema válido." };
  try { await createTheme({ actor: await requireUser(), ...parsed.data }); revalidatePath("/questoes"); return { status: "success", message: "Tema cadastrado." }; }
  catch (error) { return errorState(error, "Não foi possível cadastrar o tema."); }
}

export async function createSkillAction(_state: QuestionActionState, data: FormData): Promise<QuestionActionState> {
  const parsed = createSkillSchema.safeParse({ themeId: data.get("themeId"), name: data.get("name") });
  if (!parsed.success) return { status: "error", message: "Selecione o tema e informe a habilidade." };
  try { await createSkill({ actor: await requireUser(), ...parsed.data }); revalidatePath("/questoes"); return { status: "success", message: "Habilidade cadastrada." }; }
  catch (error) { return errorState(error, "Não foi possível cadastrar a habilidade."); }
}

export async function createQuestionAction(_state: QuestionActionState, data: FormData): Promise<QuestionActionState> {
  const parsed = createQuestionSchema.safeParse(Object.fromEntries(data));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  try { await createQuestion({ actor: await requireUser(), ...parsed.data }); revalidatePath("/questoes"); return { status: "success", message: "Questão cadastrada na versão 1." }; }
  catch (error) { return errorState(error, "Não foi possível cadastrar a questão."); }
}

export async function createVersionAction(_state: QuestionActionState, data: FormData): Promise<QuestionActionState> {
  const parsed = createVersionSchema.safeParse(Object.fromEntries(data));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  try { const result = await createVersion({ actor: await requireUser(), ...parsed.data }); revalidatePath("/questoes"); revalidatePath(`/questoes/${result.id}`); return { status: "success", message: `Versão ${result.versionNumber} criada sem alterar o histórico.` }; }
  catch (error) { return errorState(error, "Não foi possível criar a versão."); }
}

export async function updateQuestionStatusAction(_state: QuestionActionState, data: FormData): Promise<QuestionActionState> {
  const parsed = updateQuestionStatusSchema.safeParse(Object.fromEntries(data));
  if (!parsed.success) return { status: "error", message: "Estado ou revisão inválidos." };
  try { const result = await updateQuestionStatus({ actor: await requireUser(), ...parsed.data }); revalidatePath("/questoes"); revalidatePath(`/questoes/${result.id}`); return { status: "success", message: result.status === "ARCHIVED" ? "Questão arquivada sem apagar o histórico." : "Questão reativada." }; }
  catch (error) { return errorState(error, "Não foi possível alterar o estado da questão."); }
}

async function richContentFromForm(data: FormData): Promise<RichContentInput> {
  const parsed = richQuestionScalarSchema.safeParse(Object.fromEntries(data));
  if (!parsed.success) throw new AuthorizationError("VALIDATION", parsed.error.issues[0]?.message ?? "Conteúdo inválido.");
  const optionKeys = data.getAll("optionKey").map(String);
  const optionTexts = data.getAll("optionText").map(String);
  const correctKey = String(data.get("correctOption") ?? "");
  if (optionKeys.length !== optionTexts.length) throw new AuthorizationError("VALIDATION", "Alternativas inválidas.");
  const options = optionTexts.map((text, index) => ({ stableId: /^[0-9a-f-]{36}$/i.test(optionKeys[index] ?? "") ? optionKeys[index] : null, text, isCorrect: optionKeys[index] === correctKey }));
  let media: MediaInput | null = null;
  const file = data.get("image");
  if (file instanceof File && file.size > 0) media = { bytes: new Uint8Array(await file.arrayBuffer()), mimeType: file.type, altText: String(data.get("altText") ?? "") };
  return { ...parsed.data, options, media, preservedAltText: String(data.get("altText") ?? "") || null };
}

export async function createRichQuestionAction(_state: QuestionActionState, data: FormData): Promise<QuestionActionState> {
  try { const content = await richContentFromForm(data); const result = await createRichQuestion({ actor: await requireUser(), content }); revalidatePath("/questoes"); return { status: "success", message: "Questão completa cadastrada.", createdId: result.id }; }
  catch (error) { return errorState(error, "Não foi possível cadastrar a questão."); }
}

export async function createRichVersionAction(_state: QuestionActionState, data: FormData): Promise<QuestionActionState> {
  const questionId = String(data.get("questionId") ?? ""); const revision = Number(data.get("revision"));
  try { const content = await richContentFromForm(data); const result = await createRichVersion({ actor: await requireUser(), questionId, revision, content }); revalidatePath("/questoes"); revalidatePath(`/questoes/${result.id}`); return { status: "success", message: `Versão ${result.versionNumber} criada com conteúdo completo.` }; }
  catch (error) { return errorState(error, "Não foi possível criar a versão."); }
}

export async function correctPreviewAnswerAction(_state: QuestionActionState, data: FormData): Promise<QuestionActionState> {
  const parsed = previewAnswerSchema.safeParse(Object.fromEntries(data)); if (!parsed.success) return { status: "error", message: "Informe uma resposta válida." };
  try { const correction = await correctPreviewAnswer({ actor: await requireUser(), ...parsed.data }); return { status: "success", message: correction.correct ? "Resposta correta." : "Resposta incorreta.", correction }; }
  catch (error) { return errorState(error, "Não foi possível corrigir a resposta."); }
}

export async function submitQuestionAction(_state: QuestionActionState, data: FormData): Promise<QuestionActionState> {
  const parsed = submitQuestionSchema.safeParse(Object.fromEntries(data)); if (!parsed.success) return { status: "error", message: "Versão inválida." };
  try { const result = await submitQuestionVersion({ actor: await requireUser(), ...parsed.data }); revalidatePath("/questoes"); revalidatePath(`/questoes/${String(data.get("questionId") ?? "")}`); return { status: "success", message: result.status === "SUBMITTED" ? "Versão enviada à SEMED." : "Esta versão já foi enviada." }; }
  catch (error) { return errorState(error, "Não foi possível enviar a versão."); }
}

export async function startReviewAction(_state: QuestionActionState, data: FormData): Promise<QuestionActionState> {
  const parsed = startReviewSchema.safeParse(Object.fromEntries(data)); if (!parsed.success) return { status: "error", message: "Envio ou revisão inválidos." };
  try { await startSubmissionReview({ actor: await requireUser(), ...parsed.data }); revalidatePath("/questoes/revisao"); return { status: "success", message: "Análise iniciada." }; }
  catch (error) { return errorState(error, "Não foi possível iniciar a análise."); }
}

export async function decideSubmissionAction(_state: QuestionActionState, data: FormData): Promise<QuestionActionState> {
  const parsed = decideSubmissionSchema.safeParse(Object.fromEntries(data)); if (!parsed.success) return { status: "error", message: "Decisão inválida." };
  try { const result = await decideSubmission({ actor: await requireUser(), ...parsed.data }); revalidatePath("/questoes"); revalidatePath("/questoes/revisao"); return { status: "success", message: result.status === "APPROVED_PUBLISHED" ? "Questão aprovada e publicada na rede." : result.status === "CHANGES_REQUESTED" ? "Ajustes solicitados ao autor." : "Questão recusada." }; }
  catch (error) { return errorState(error, "Não foi possível registrar a decisão."); }
}
