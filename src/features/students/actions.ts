"use server";

import { revalidatePath } from "next/cache";
import { AuthorizationError } from "@/src/server/auth/errors";
import { resetStudentPassword } from "@/src/server/auth/password-reset";
import { requireUser } from "@/src/server/auth/policies";
import {
  authorizeCoordinatorStudentReset,
  createStudent,
  endEnrollment,
  getStudent,
  transferStudent,
} from "@/src/server/students/service";
import {
  createStudentSchema,
  endEnrollmentSchema,
  resetEnrolledStudentPasswordSchema,
  transferStudentSchema,
} from "./schemas";

export type StudentActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  studentCode?: string;
};

function publicError(error: unknown, fallback: string) {
  return error instanceof AuthorizationError ? error.message : fallback;
}

function revalidateStudentPaths(schoolId: string, studentId?: string) {
  revalidatePath("/escola");
  revalidatePath("/escola/alunos");
  if (studentId) revalidatePath(`/escola/alunos/${studentId}`);
  revalidatePath(`/admin/escolas/${schoolId}`);
  revalidatePath(`/admin/escolas/${schoolId}/alunos`);
  if (studentId) revalidatePath(`/admin/escolas/${schoolId}/alunos/${studentId}`);
  revalidatePath("/escola/turmas");
  revalidatePath(`/admin/escolas/${schoolId}/turmas`);
}

export async function createStudentAction(_state: StudentActionState, formData: FormData): Promise<StudentActionState> {
  const parsed = createStudentSchema.safeParse({
    schoolId: formData.get("schoolId"),
    classId: formData.get("classId"),
    name: formData.get("name"),
    temporaryPassword: formData.get("temporaryPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  try {
    const actor = await requireUser();
    const created = await createStudent({
      actor,
      schoolId: parsed.data.schoolId,
      classId: parsed.data.classId,
      name: parsed.data.name,
      temporaryPassword: parsed.data.temporaryPassword,
    });
    revalidateStudentPaths(parsed.data.schoolId, created.student.id);
    return {
      status: "success",
      message: "Aluno cadastrado e matriculado.",
      studentCode: created.studentCode,
    };
  } catch (error) {
    return { status: "error", message: publicError(error, "Não foi possível cadastrar o aluno.") };
  }
}

export async function transferStudentAction(_state: StudentActionState, formData: FormData): Promise<StudentActionState> {
  const parsed = transferStudentSchema.safeParse({
    schoolId: formData.get("schoolId"),
    studentId: formData.get("studentId"),
    targetClassId: formData.get("targetClassId"),
    enrollmentRevision: formData.get("enrollmentRevision"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  try {
    const actor = await requireUser();
    await transferStudent({ actor, ...parsed.data });
    revalidateStudentPaths(parsed.data.schoolId, parsed.data.studentId);
    return { status: "success", message: "Transferência concluída. O histórico anterior foi preservado." };
  } catch (error) {
    return { status: "error", message: publicError(error, "Não foi possível transferir o aluno.") };
  }
}

export async function endEnrollmentAction(_state: StudentActionState, formData: FormData): Promise<StudentActionState> {
  const parsed = endEnrollmentSchema.safeParse({
    schoolId: formData.get("schoolId"),
    studentId: formData.get("studentId"),
    enrollmentRevision: formData.get("enrollmentRevision"),
    confirmation: formData.get("confirmation"),
  });
  if (!parsed.success) return { status: "error", message: "Matrícula inválida." };
  try {
    const actor = await requireUser();
    await endEnrollment({
      actor,
      schoolId: parsed.data.schoolId,
      studentId: parsed.data.studentId,
      enrollmentRevision: parsed.data.enrollmentRevision,
    });
    revalidateStudentPaths(parsed.data.schoolId, parsed.data.studentId);
    return { status: "success", message: "Matrícula encerrada. O histórico foi preservado." };
  } catch (error) {
    return { status: "error", message: publicError(error, "Não foi possível encerrar a matrícula.") };
  }
}

export async function resetEnrolledStudentPasswordAction(
  _state: StudentActionState,
  formData: FormData,
): Promise<StudentActionState> {
  const parsed = resetEnrolledStudentPasswordSchema.safeParse({
    schoolId: formData.get("schoolId"),
    studentId: formData.get("studentId"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  try {
    const actor = await requireUser();
    await getStudent({ actor, schoolId: parsed.data.schoolId, studentId: parsed.data.studentId });
    await resetStudentPassword({
      actor,
      studentId: parsed.data.studentId,
      newPassword: parsed.data.newPassword,
      auditSchoolId: parsed.data.schoolId,
      authorizeCoordinator: ({ actorId, studentId }) => authorizeCoordinatorStudentReset({
        actorId,
        studentId,
        schoolId: parsed.data.schoolId,
      }),
    });
    return { status: "success", message: "Senha redefinida e sessões anteriores revogadas." };
  } catch (error) {
    return { status: "error", message: publicError(error, "Não foi possível redefinir a senha.") };
  }
}
