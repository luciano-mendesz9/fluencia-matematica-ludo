import { z } from "zod";
import { newPasswordSchema } from "@/src/server/auth/password-policy";

export const requestResetSchema = z.object({ email: z.email().max(320) });

export const consumeResetSchema = z.object({
  token: z.string().min(32).max(256),
  newPassword: newPasswordSchema,
  confirmPassword: z.string(),
}).refine((input) => input.newPassword === input.confirmPassword, {
  path: ["confirmPassword"],
  message: "As senhas informadas não coincidem.",
});

export const assistedStudentResetSchema = z.object({
  studentCode: z.string().trim().min(3).max(80).regex(/^[\p{L}\p{N}._-]+$/u),
  newPassword: newPasswordSchema,
  confirmPassword: z.string(),
}).refine((input) => input.newPassword === input.confirmPassword, {
  path: ["confirmPassword"],
  message: "As senhas informadas não coincidem.",
});
