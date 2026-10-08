"use server";

import { revalidatePath, refresh } from "next/cache";
import { AuthorizationError } from "@/src/server/auth/errors";
import { requireUser } from "@/src/server/auth/policies";
import {
  createAcademicYear,
  createClassGroup,
  updateAcademicYear,
  updateClassGroup,
} from "@/src/server/academics/service";
import {
  createAcademicYearSchema,
  createClassGroupSchema,
  updateAcademicYearSchema,
  updateClassGroupSchema,
} from "./schemas";

export type AcademicActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

function publicError(error: unknown, fallback: string) {
  return error instanceof AuthorizationError ? error.message : fallback;
}

function revalidateAcademicPaths(schoolId: string, classGroupId?: string, academicYearId?: string) {
  revalidatePath("/escola");
  revalidatePath("/escola/anos");
  revalidatePath("/escola/turmas");
  if (academicYearId) revalidatePath(`/escola/anos/${academicYearId}`);
  if (classGroupId) revalidatePath(`/escola/turmas/${classGroupId}`);
  revalidatePath(`/admin/escolas/${schoolId}`);
  revalidatePath(`/admin/escolas/${schoolId}/anos`);
  revalidatePath(`/admin/escolas/${schoolId}/turmas`);
  if (academicYearId) revalidatePath(`/admin/escolas/${schoolId}/anos/${academicYearId}`);
  if (classGroupId) revalidatePath(`/admin/escolas/${schoolId}/turmas/${classGroupId}`);
}

export async function createAcademicYearAction(
  _state: AcademicActionState,
  formData: FormData,
): Promise<AcademicActionState> {
  const parsed = createAcademicYearSchema.safeParse({ schoolId: formData.get("schoolId"), year: formData.get("year") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  try {
    const actor = await requireUser();
    const created = await createAcademicYear({ actor, ...parsed.data });
    revalidateAcademicPaths(parsed.data.schoolId, undefined, created.id);
    return { status: "success", message: "Ano letivo cadastrado." };
  } catch (error) {
    return { status: "error", message: publicError(error, "Não foi possível cadastrar o ano letivo.") };
  }
}

export async function updateAcademicYearAction(
  _state: AcademicActionState,
  formData: FormData,
): Promise<AcademicActionState> {
  const parsed = updateAcademicYearSchema.safeParse({
    schoolId: formData.get("schoolId"),
    academicYearId: formData.get("academicYearId"),
    revision: formData.get("revision"),
    year: formData.get("year"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  try {
    const actor = await requireUser();
    await updateAcademicYear({ actor, ...parsed.data });
    revalidateAcademicPaths(parsed.data.schoolId, undefined, parsed.data.academicYearId);
    refresh();
    return { status: "success", message: "Ano letivo atualizado." };
  } catch (error) {
    return { status: "error", message: publicError(error, "Não foi possível atualizar o ano letivo.") };
  }
}

export async function createClassGroupAction(
  _state: AcademicActionState,
  formData: FormData,
): Promise<AcademicActionState> {
  const parsed = createClassGroupSchema.safeParse({
    schoolId: formData.get("schoolId"),
    academicYearId: formData.get("academicYearId"),
    grade: formData.get("grade"),
    name: formData.get("name"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  try {
    const actor = await requireUser();
    const created = await createClassGroup({ actor, ...parsed.data });
    revalidateAcademicPaths(parsed.data.schoolId, created.id, parsed.data.academicYearId);
    return { status: "success", message: "Turma cadastrada." };
  } catch (error) {
    return { status: "error", message: publicError(error, "Não foi possível cadastrar a turma.") };
  }
}

export async function updateClassGroupAction(
  _state: AcademicActionState,
  formData: FormData,
): Promise<AcademicActionState> {
  const parsed = updateClassGroupSchema.safeParse({
    schoolId: formData.get("schoolId"),
    classGroupId: formData.get("classGroupId"),
    academicYearId: formData.get("academicYearId"),
    revision: formData.get("revision"),
    grade: formData.get("grade"),
    name: formData.get("name"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  try {
    const actor = await requireUser();
    await updateClassGroup({ actor, ...parsed.data });
    revalidateAcademicPaths(parsed.data.schoolId, parsed.data.classGroupId, parsed.data.academicYearId);
    refresh();
    return { status: "success", message: "Turma atualizada." };
  } catch (error) {
    return { status: "error", message: publicError(error, "Não foi possível atualizar a turma.") };
  }
}
