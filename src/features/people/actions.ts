"use server";

import { revalidatePath } from "next/cache";
import { AuthorizationError } from "@/src/server/auth/errors";
import { requireGlobalRole, requireUser } from "@/src/server/auth/policies";
import {
  createGlobalAdult,
  createLocalAdult,
  createTeacherAssignment,
  endTeacherAssignment,
  linkExistingAdult,
  suspendLocalMembership,
  updateGlobalAdultStatus,
} from "@/src/server/people/service";
import {
  createGlobalAdultSchema,
  createLocalAdultSchema,
  createTeacherAssignmentSchema,
  endTeacherAssignmentSchema,
  linkExistingAdultSchema,
  suspendLocalMembershipSchema,
  updateGlobalAdultStatusSchema,
} from "./schemas";

export type PeopleActionState = { status: "idle" | "success" | "error"; message?: string };

function publicError(error: unknown, fallback: string) {
  return error instanceof AuthorizationError ? error.message : fallback;
}

function revalidatePeople(schoolId?: string) {
  revalidatePath("/admin/pessoas");
  if (schoolId) {
    revalidatePath(`/admin/escolas/${schoolId}`);
    revalidatePath(`/admin/escolas/${schoolId}/pessoas`);
  }
  revalidatePath("/escola/pessoas");
  revalidatePath("/professor");
  revalidatePath("/professor/turmas");
  revalidatePath("/selecionar-escola");
}

function confirmation(formData: FormData) {
  return formData.get("confirmation");
}

export async function createGlobalAdultAction(_state: PeopleActionState, formData: FormData): Promise<PeopleActionState> {
  const actor = await requireGlobalRole("SEMED_ADMIN");
  const parsed = createGlobalAdultSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    globalRole: formData.get("globalRole"),
    temporaryPassword: formData.get("temporaryPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  try {
    await createGlobalAdult({ actor, ...parsed.data });
    revalidatePeople();
    return { status: "success", message: "Conta global cadastrada." };
  } catch (error) {
    return { status: "error", message: publicError(error, "Não foi possível cadastrar a conta.") };
  }
}

export async function updateGlobalAdultStatusAction(_state: PeopleActionState, formData: FormData): Promise<PeopleActionState> {
  const actor = await requireGlobalRole("SEMED_ADMIN");
  const parsed = updateGlobalAdultStatusSchema.safeParse({
    userId: formData.get("userId"),
    revision: formData.get("revision"),
    status: formData.get("status"),
    confirmation: confirmation(formData),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Confirme a alteração." };
  try {
    await updateGlobalAdultStatus({ actor, userId: parsed.data.userId, revision: parsed.data.revision, status: parsed.data.status });
    revalidatePeople();
    return { status: "success", message: parsed.data.status === "BLOCKED" ? "Conta bloqueada e sessões revogadas." : "Conta reativada." };
  } catch (error) {
    return { status: "error", message: publicError(error, "Não foi possível alterar a conta.") };
  }
}

export async function createLocalAdultAction(_state: PeopleActionState, formData: FormData): Promise<PeopleActionState> {
  const actor = await requireUser();
  const parsed = createLocalAdultSchema.safeParse({
    schoolId: formData.get("schoolId"),
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    temporaryPassword: formData.get("temporaryPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  try {
    await createLocalAdult({ actor, ...parsed.data });
    revalidatePeople(parsed.data.schoolId);
    return { status: "success", message: "Conta adulta cadastrada e vinculada." };
  } catch (error) {
    return { status: "error", message: publicError(error, "Não foi possível cadastrar a pessoa.") };
  }
}

export async function linkExistingAdultAction(_state: PeopleActionState, formData: FormData): Promise<PeopleActionState> {
  const actor = await requireUser();
  const parsed = linkExistingAdultSchema.safeParse({
    schoolId: formData.get("schoolId"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  try {
    await linkExistingAdult({ actor, ...parsed.data });
    revalidatePeople(parsed.data.schoolId);
    return { status: "success", message: "Conta existente vinculada à escola." };
  } catch (error) {
    return { status: "error", message: publicError(error, "Não foi possível criar o vínculo.") };
  }
}

export async function suspendLocalMembershipAction(_state: PeopleActionState, formData: FormData): Promise<PeopleActionState> {
  const actor = await requireUser();
  const parsed = suspendLocalMembershipSchema.safeParse({
    schoolId: formData.get("schoolId"),
    membershipId: formData.get("membershipId"),
    revision: formData.get("revision"),
    confirmation: confirmation(formData),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Confirme a suspensão." };
  try {
    await suspendLocalMembership({ actor, schoolId: parsed.data.schoolId, membershipId: parsed.data.membershipId, revision: parsed.data.revision });
    revalidatePeople(parsed.data.schoolId);
    return { status: "success", message: "Vínculo suspenso e atribuições ativas encerradas." };
  } catch (error) {
    return { status: "error", message: publicError(error, "Não foi possível suspender o vínculo.") };
  }
}

function endOfLocalDate(value?: string) {
  return value ? new Date(`${value}T03:00:00.000Z`) : null;
}

export async function createTeacherAssignmentAction(_state: PeopleActionState, formData: FormData): Promise<PeopleActionState> {
  const actor = await requireUser();
  const parsed = createTeacherAssignmentSchema.safeParse({
    schoolId: formData.get("schoolId"),
    membershipId: formData.get("membershipId"),
    classId: formData.get("classId"),
    endsOn: formData.get("endsOn") ?? "",
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  try {
    await createTeacherAssignment({
      actor,
      schoolId: parsed.data.schoolId,
      membershipId: parsed.data.membershipId,
      classId: parsed.data.classId,
      startsAt: new Date(),
      endsAt: endOfLocalDate(parsed.data.endsOn),
    });
    revalidatePeople(parsed.data.schoolId);
    return { status: "success", message: "Professor atribuído à turma." };
  } catch (error) {
    return { status: "error", message: publicError(error, "Não foi possível atribuir a turma.") };
  }
}

export async function endTeacherAssignmentAction(_state: PeopleActionState, formData: FormData): Promise<PeopleActionState> {
  const actor = await requireUser();
  const parsed = endTeacherAssignmentSchema.safeParse({
    schoolId: formData.get("schoolId"),
    assignmentId: formData.get("assignmentId"),
    revision: formData.get("revision"),
    confirmation: confirmation(formData),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Confirme o encerramento." };
  try {
    await endTeacherAssignment({ actor, schoolId: parsed.data.schoolId, assignmentId: parsed.data.assignmentId, revision: parsed.data.revision });
    revalidatePeople(parsed.data.schoolId);
    return { status: "success", message: "Atribuição encerrada; o histórico foi preservado." };
  } catch (error) {
    return { status: "error", message: publicError(error, "Não foi possível encerrar a atribuição.") };
  }
}
