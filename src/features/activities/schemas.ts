import { z } from "zod";

const uuid = z.string().uuid("Identificador inválido.");
export const activityDraftSchema = z.object({ classId: uuid, schoolId: uuid, title: z.string().trim().min(3).max(160), instructions: z.string().trim().max(1000).optional(), targetCount: z.coerce.number().int().min(1).max(1000), questionVersionIds: z.array(uuid) });
export const activityUpdateSchema = activityDraftSchema.omit({ classId: true, schoolId: true }).extend({ activityId: uuid, revision: z.coerce.number().int().positive() });
export const activityLifecycleSchema = z.object({ activityId: uuid, revision: z.coerce.number().int().positive() });
