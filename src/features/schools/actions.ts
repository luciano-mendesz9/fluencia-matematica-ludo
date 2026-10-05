"use server";

import { revalidatePath } from "next/cache";
import { AuthorizationError } from "@/src/server/auth/errors";
import { requireGlobalRole, requireUser } from "@/src/server/auth/policies";
import { clearSchoolContextCookie, schoolDestinationForRole, setSchoolContextCookie } from "@/src/server/schools/context";
import {
  addSchoolMembership,
  createSchool,
  resolveActiveSchoolMembership,
  suspendSchoolMembership,
  updateSchool,
} from "@/src/server/schools/service";
import {
  createSchoolSchema,
  membershipSchema,
  selectSchoolSchema,
  suspendMembershipSchema,
  updateSchoolSchema,
} from "./schemas";

export type SchoolActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export type SchoolSelectionState = SchoolActionState & {
  userId?: string;
  schoolId?: string;
  redirect?: "/escola" | "/professor";
};

function publicError(error: unknown, fallback: string) {
  return error instanceof AuthorizationError ? error.message : fallback;
}

export async function createSchoolAction(_state: SchoolActionState, formData: FormData): Promise<SchoolActionState> {
  const actor = await requireGlobalRole("SEMED_ADMIN");
  const parsed = createSchoolSchema.safeParse({ name: formData.get("name"), externalCode: formData.get("externalCode") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  try {
    await createSchool({ actor, ...parsed.data });
    revalidatePath("/admin/escolas");
    return { status: "success", message: "Escola cadastrada." };
  } catch (error) {
    return { status: "error", message: publicError(error, "Não foi possível cadastrar a escola.") };
  }
}

export async function updateSchoolAction(_state: SchoolActionState, formData: FormData): Promise<SchoolActionState> {
  const actor = await requireGlobalRole("SEMED_ADMIN");
  const parsed = updateSchoolSchema.safeParse({
    schoolId: formData.get("schoolId"),
    revision: formData.get("revision"),
    name: formData.get("name"),
    externalCode: formData.get("externalCode"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  try {
    await updateSchool({ actor, ...parsed.data });
    revalidatePath("/admin/escolas");
    revalidatePath(`/admin/escolas/${parsed.data.schoolId}`);
    return { status: "success", message: "Escola atualizada." };
  } catch (error) {
    return { status: "error", message: publicError(error, "Não foi possível atualizar a escola.") };
  }
}

export async function addMembershipAction(_state: SchoolActionState, formData: FormData): Promise<SchoolActionState> {
  const actor = await requireGlobalRole("SEMED_ADMIN");
  const parsed = membershipSchema.safeParse({
    schoolId: formData.get("schoolId"),
    adultEmail: formData.get("adultEmail"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  try {
    await addSchoolMembership({ actor, ...parsed.data });
    revalidatePath(`/admin/escolas/${parsed.data.schoolId}`);
    return { status: "success", message: "Vínculo criado." };
  } catch (error) {
    return { status: "error", message: publicError(error, "Não foi possível criar o vínculo.") };
  }
}

export async function suspendMembershipAction(_state: SchoolActionState, formData: FormData): Promise<SchoolActionState> {
  const actor = await requireGlobalRole("SEMED_ADMIN");
  const parsed = suspendMembershipSchema.safeParse({
    membershipId: formData.get("membershipId"),
    revision: formData.get("revision"),
    schoolId: formData.get("schoolId"),
  });
  if (!parsed.success) return { status: "error", message: "Vínculo inválido." };
  try {
    await suspendSchoolMembership({ actor, membershipId: parsed.data.membershipId, revision: parsed.data.revision });
    revalidatePath(`/admin/escolas/${parsed.data.schoolId}`);
    return { status: "success", message: "Vínculo suspenso." };
  } catch (error) {
    return { status: "error", message: publicError(error, "Não foi possível suspender o vínculo.") };
  }
}

export async function selectSchoolAction(_state: SchoolSelectionState, formData: FormData): Promise<SchoolSelectionState> {
  const actor = await requireUser();
  if (actor.studentCode || actor.globalRole) return { status: "error", message: "Seleção de escola não disponível para esta conta." };
  const parsed = selectSchoolSchema.safeParse({ schoolId: formData.get("schoolId") });
  if (!parsed.success) return { status: "error", message: "Escola inválida." };
  const membership = await resolveActiveSchoolMembership({ userId: actor.id, schoolId: parsed.data.schoolId });
  if (!membership) {
    await clearSchoolContextCookie();
    return { status: "error", message: "A escola não está disponível para esta conta.", userId: actor.id, schoolId: parsed.data.schoolId };
  }
  await setSchoolContextCookie(actor.id, membership.schoolId);
  return {
    status: "success",
    message: "Escola selecionada.",
    userId: actor.id,
    schoolId: membership.schoolId,
    redirect: schoolDestinationForRole(membership.role),
  };
}
