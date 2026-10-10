"use server";

import { revalidatePath } from "next/cache";
import { AuthorizationError } from "@/src/server/auth/errors";
import { requireUser } from "@/src/server/auth/policies";
import { closeActivity, createActivity, openActivity, updateActivity } from "@/src/server/activities/service";
import { activityDraftSchema, activityLifecycleSchema, activityUpdateSchema } from "./schemas";

export type ActivityActionState = { status: "idle" | "success" | "error"; message?: string; activityId?: string };
const errorState = (error: unknown, fallback: string): ActivityActionState => ({ status: "error", message: error instanceof AuthorizationError ? error.message : fallback });
const values = (data: FormData) => ({ ...Object.fromEntries(data), questionVersionIds: data.getAll("questionVersionIds").map(String) });

export async function createActivityAction(_state: ActivityActionState, data: FormData): Promise<ActivityActionState> {
  const parsed = activityDraftSchema.safeParse(values(data));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  try { const result = await createActivity({ actor: await requireUser(), ...parsed.data }); revalidatePath("/atividades"); return { status: "success", message: "Rascunho criado.", activityId: result.id }; }
  catch (error) { return errorState(error, "Não foi possível criar a atividade."); }
}

export async function updateActivityAction(_state: ActivityActionState, data: FormData): Promise<ActivityActionState> {
  const parsed = activityUpdateSchema.safeParse(values(data));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  try { const result = await updateActivity({ actor: await requireUser(), ...parsed.data }); revalidatePath(`/atividades/${result.id}`); return { status: "success", message: "Rascunho atualizado." }; }
  catch (error) { return errorState(error, "Não foi possível atualizar a atividade."); }
}

export async function openActivityAction(_state: ActivityActionState, data: FormData): Promise<ActivityActionState> {
  const parsed = activityLifecycleSchema.safeParse(Object.fromEntries(data)); if (!parsed.success) return { status: "error", message: "Atividade ou revisão inválida." };
  try { const result = await openActivity({ actor: await requireUser(), ...parsed.data }); revalidatePath("/atividades"); revalidatePath(`/atividades/${result.id}`); revalidatePath("/aluno"); revalidatePath(`/aluno/atividades/${result.id}`); return { status: "success", message: "Atividade aberta para os alunos." }; }
  catch (error) { return errorState(error, "Não foi possível abrir a atividade."); }
}

export async function closeActivityAction(_state: ActivityActionState, data: FormData): Promise<ActivityActionState> {
  const parsed = activityLifecycleSchema.safeParse(Object.fromEntries(data)); if (!parsed.success) return { status: "error", message: "Atividade ou revisão inválida." };
  try { const result = await closeActivity({ actor: await requireUser(), ...parsed.data }); revalidatePath("/atividades"); revalidatePath(`/atividades/${result.id}`); revalidatePath("/aluno"); revalidatePath(`/aluno/atividades/${result.id}`); return { status: "success", message: "Atividade encerrada. O progresso foi preservado." }; }
  catch (error) { return errorState(error, "Não foi possível encerrar a atividade."); }
}
