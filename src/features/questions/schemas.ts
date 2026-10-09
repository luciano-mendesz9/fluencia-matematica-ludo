import { z } from "zod";

const uuid = z.uuid("Identificador inválido.");
const questionFields = {
  grade: z.coerce.number().int().min(1).max(5),
  difficulty: z.coerce.number().int().min(1).max(6),
  themeId: uuid,
  skillId: z.union([uuid, z.literal("")]).transform((value) => value || null),
  statement: z.string().trim().min(5, "O enunciado deve ter ao menos 5 caracteres.").max(2000, "O enunciado deve ter até 2.000 caracteres."),
};

export const createThemeSchema = z.object({ name: z.string().trim().min(2).max(120) });
export const createSkillSchema = z.object({ themeId: uuid, name: z.string().trim().min(2).max(160) });
export const createQuestionSchema = z.object(questionFields);
export const createVersionSchema = z.object({ questionId: uuid, revision: z.coerce.number().int().positive(), ...questionFields });

export const questionFiltersSchema = z.object({
  grade: z.coerce.number().int().min(1).max(5).optional().catch(undefined),
  difficulty: z.coerce.number().int().min(1).max(6).optional().catch(undefined),
  themeId: uuid.optional().catch(undefined),
  origin: z.enum(["SEMED", "PRIVATE"]).optional().catch(undefined),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional().catch(undefined),
});

export const updateQuestionStatusSchema = z.object({ questionId: uuid, revision: z.coerce.number().int().positive(), status: z.enum(["ACTIVE", "ARCHIVED"]) });
