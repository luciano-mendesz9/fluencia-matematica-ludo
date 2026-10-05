import { z } from "zod";

export const newPasswordSchema = z.string()
  .min(12, "A nova senha deve ter pelo menos 12 caracteres.")
  .max(128, "A nova senha deve ter no máximo 128 caracteres.")
  .regex(/\p{L}/u, "A nova senha deve conter uma letra.")
  .regex(/\p{N}/u, "A nova senha deve conter um número.");
