import { z } from "zod";
import { newPasswordSchema } from "@/src/server/auth/password-policy";

const schoolId = z.uuid("Escola inválida.");
const membershipId = z.uuid("Vínculo inválido.");
const assignmentId = z.uuid("Atribuição inválida.");
const classId = z.uuid("Turma inválida.");
const revision = z.coerce.number().int().positive("Revisão inválida.");
const name = z.string().trim().min(2, "Informe o nome da pessoa.").max(160, "O nome deve ter até 160 caracteres.");
const email = z.email("Informe um e-mail válido.").max(320);
const confirmation = z.literal("yes", "Confirme a operação.");

const passwordFields = {
  temporaryPassword: newPasswordSchema,
  confirmPassword: z.string(),
};

export const createGlobalAdultSchema = z.object({
  name,
  email,
  globalRole: z.enum(["SEMED_ADMIN", "DEVELOPER"]),
  ...passwordFields,
}).refine((data) => data.temporaryPassword === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

export const updateGlobalAdultStatusSchema = z.object({
  userId: z.uuid("Conta inválida."),
  revision,
  status: z.enum(["ACTIVE", "BLOCKED"]),
  confirmation,
});

export const createLocalAdultSchema = z.object({
  schoolId,
  name,
  email,
  role: z.enum(["COORDINATOR", "TEACHER"]),
  ...passwordFields,
}).refine((data) => data.temporaryPassword === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

export const linkExistingAdultSchema = z.object({
  schoolId,
  email,
  role: z.enum(["COORDINATOR", "TEACHER"]),
});

export const suspendLocalMembershipSchema = z.object({
  schoolId,
  membershipId,
  revision,
  confirmation,
});

export const createTeacherAssignmentSchema = z.object({
  schoolId,
  membershipId,
  classId,
  endsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data final inválida.").optional().or(z.literal("")),
});

export const endTeacherAssignmentSchema = z.object({
  schoolId,
  assignmentId,
  revision,
  confirmation,
});
