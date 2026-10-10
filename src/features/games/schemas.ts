import { z } from "zod";

const uuid = z.string().uuid("Identificador inválido.");

export const gameStartSchema = z.object({ activityId: uuid });
export const gameRollSchema = z.object({
  gameId: uuid,
  clientActionId: uuid,
  expectedRevision: z.coerce.number().int().positive("Revisão inválida."),
});
