import { z } from "zod";

const uuid = z.string().uuid("Identificador inválido.");

export const gameStartSchema = z.object({ activityId: uuid });
export const gameRollSchema = z.object({
  gameId: uuid,
  clientActionId: uuid,
  expectedRevision: z.coerce.number().int().positive("Revisão inválida."),
});

export const gameAnswerSchema = z.object({
  gameId: uuid,
  challengeId: uuid,
  clientActionId: uuid,
  expectedRevision: z.coerce.number().int().positive("Revisão inválida."),
  response: z.string().max(100, "Resposta muito longa."),
});

export const gameMoveSchema = z.object({
  gameId: uuid,
  pieceId: z.enum(["s1", "s2", "s3", "s4"], { message: "Pino inválido." }),
  clientActionId: uuid,
  expectedRevision: z.coerce.number().int().positive("Revisão inválida."),
});
