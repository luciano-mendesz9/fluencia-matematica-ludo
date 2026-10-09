"use server";

import { revalidatePath } from "next/cache";
import { AuthorizationError } from "@/src/server/auth/errors";
import { requireUser } from "@/src/server/auth/policies";
import { createQuestion, createSkill, createTheme, createVersion, updateQuestionStatus } from "@/src/server/questions/service";
import { createQuestionSchema, createSkillSchema, createThemeSchema, createVersionSchema, updateQuestionStatusSchema } from "./schemas";

export type QuestionActionState = { status: "idle" | "success" | "error"; message?: string };

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
