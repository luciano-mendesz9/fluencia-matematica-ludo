"use server";

import { revalidatePath } from "next/cache";
import { AuthorizationError } from "@/src/server/auth/errors";
import { requireUser } from "@/src/server/auth/policies";
import { rollGame, startOrResumeGame } from "@/src/server/games/service";
import { gameRollSchema, gameStartSchema } from "./schemas";

export type GameActionState = { status: "idle" | "success" | "error"; message?: string };
const errorState = (error: unknown, fallback: string): GameActionState => ({
  status: "error",
  message: error instanceof AuthorizationError ? error.message : fallback,
});

export async function startGameAction(_state: GameActionState, data: FormData): Promise<GameActionState> {
  const parsed = gameStartSchema.safeParse(Object.fromEntries(data));
  if (!parsed.success) return { status: "error", message: "Atividade inválida." };
  try {
    await startOrResumeGame({ actor: await requireUser(), activityId: parsed.data.activityId });
    revalidatePath(`/aluno/atividades/${parsed.data.activityId}`);
    return { status: "success", message: "Partida pronta." };
  } catch (error) { return errorState(error, "Não foi possível iniciar a partida."); }
}

export async function rollGameAction(_state: GameActionState, data: FormData): Promise<GameActionState> {
  const parsed = gameRollSchema.safeParse(Object.fromEntries(data));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Lançamento inválido." };
  try {
    const result = await rollGame({ actor: await requireUser(), ...parsed.data });
    const message = result.game.challenge
      ? `Dado ${result.roll.studentDice}: desafio criado.`
      : result.game.phase === "STUDENT_ROLL" && result.roll.studentDice === 6 && result.roll.candidateMoves.length === 0
        ? "Primeiro pino liberado. Lance novamente para receber um desafio."
        : result.roll.noChallengeReason === "CONTENT_UNAVAILABLE"
          ? `Dado ${result.roll.studentDice}: não há conteúdo disponível para esta dificuldade.`
          : `Dado ${result.roll.studentDice}: turno concluído sem desafio.`;
    revalidatePath(`/aluno/atividades/${data.get("activityId")}`);
    return { status: "success", message };
  } catch (error) {
    revalidatePath(`/aluno/atividades/${data.get("activityId")}`);
    return errorState(error, "Não foi possível lançar o dado.");
  }
}
