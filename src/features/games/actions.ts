"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthorizationError } from "@/src/server/auth/errors";
import { requireUser } from "@/src/server/auth/policies";
import { answerGame, moveGame, rollGame, startOrResumeGame } from "@/src/server/games/service";
import { gameAnswerSchema, gameMoveSchema, gameRollSchema, gameStartSchema } from "./schemas";

export type GameActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  event?:
    | { id: string; kind: "ROLL"; studentDice: number; machineRolls: Array<{ dice: number; pieceId: string | null }> }
    | { id: string; kind: "MOVE"; movedPieceId: string; machineRolls: Array<{ dice: number; pieceId: string | null }> };
};
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
  } catch (error) { return errorState(error, "Não foi possível iniciar a partida."); }
  redirect(`/aluno/atividades/${parsed.data.activityId}/jogo`);
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
    return { status: "success", message, event: { id: parsed.data.clientActionId, kind: "ROLL", studentDice: result.roll.studentDice, machineRolls: result.roll.machineRolls } };
  } catch (error) {
    revalidatePath(`/aluno/atividades/${data.get("activityId")}`);
    return errorState(error, "Não foi possível lançar o dado.");
  }
}

export async function answerGameAction(_state: GameActionState, data: FormData): Promise<GameActionState> {
  const parsed = gameAnswerSchema.safeParse(Object.fromEntries(data));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Resposta inválida." };
  try {
    const result = await answerGame({ actor: await requireUser(), ...parsed.data });
    revalidatePath(`/aluno/atividades/${data.get("activityId")}`);
    revalidatePath(`/aluno/atividades/${data.get("activityId")}/jogo`);
    return { status: "success", message: result.game.feedback?.outcome === "CORRECT" ? `Resposta correta! +${result.game.feedback.awardedPoints} pontos.` : "Vamos tentar novamente. Confira a explicação." };
  } catch (error) {
    revalidatePath(`/aluno/atividades/${data.get("activityId")}/jogo`);
    return errorState(error, "Não foi possível registrar a resposta.");
  }
}

export async function moveGameAction(_state: GameActionState, data: FormData): Promise<GameActionState> {
  const parsed = gameMoveSchema.safeParse(Object.fromEntries(data));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Movimento inválido." };
  try {
    const result = await moveGame({ actor: await requireUser(), ...parsed.data });
    revalidatePath(`/aluno/atividades/${data.get("activityId")}`);
    revalidatePath(`/aluno/atividades/${data.get("activityId")}/jogo`);
    return { status: "success", message: result.victoryBonus ? "Vitória! Bônus de 30 pontos concedido." : result.capturedPieceIds.length ? "Movimento concluído com captura." : "Movimento concluído.", event: { id: parsed.data.clientActionId, kind: "MOVE", movedPieceId: result.movedPieceId, machineRolls: result.machineRolls } };
  } catch (error) {
    revalidatePath(`/aluno/atividades/${data.get("activityId")}/jogo`);
    return errorState(error, "Não foi possível mover o pino.");
  }
}
