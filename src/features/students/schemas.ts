import { z } from "zod";
import { newPasswordSchema } from "@/src/server/auth/password-policy";

const schoolId = z.uuid("Escola inválida.");
const studentId = z.uuid("Aluno inválido.");
const classId = z.uuid("Turma inválida.");
const revision = z.coerce.number().int().positive("Revisão inválida.");
const name = z.string().trim().min(2, "Informe o nome do aluno.").max(160, "O nome deve ter até 160 caracteres.");

export const createStudentSchema = z.object({
  schoolId,
  classId,
  name,
  temporaryPassword: newPasswordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.temporaryPassword === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

export const transferStudentSchema = z.object({
  schoolId,
  studentId,
  targetClassId: classId,
  enrollmentRevision: revision,
});

export const endEnrollmentSchema = z.object({
  schoolId,
  studentId,
  enrollmentRevision: revision,
  confirmation: z.literal("yes", "Confirme o encerramento da matrícula."),
});

export const resetEnrolledStudentPasswordSchema = z.object({
  schoolId,
  studentId,
  newPassword: newPasswordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});
