import { describe, expect, it } from "vitest";
import { gameAnswerSchema, gameMoveSchema, gameRollSchema, gameStartSchema } from "../../src/features/games/schemas";
import { awardFor } from "../../src/domain/points";

const id = "00000000-0000-4000-8000-000000000001";

describe("game input schemas", () => {
  it("accepts only stable identifiers when starting a game", () => {
    expect(gameStartSchema.safeParse({ activityId: id }).success).toBe(true);
    expect(gameStartSchema.safeParse({ activityId: "activity" }).success).toBe(false);
  });

  it("requires a positive revision and ignores client-owned game decisions", () => {
    const parsed = gameRollSchema.parse({
      gameId: id,
      clientActionId: id,
      expectedRevision: "2",
      dice: 6,
      questionVersionId: id,
      correct: true,
    });
    expect(parsed).toEqual({ gameId: id, clientActionId: id, expectedRevision: 2 });
    expect(gameRollSchema.safeParse({ gameId: id, clientActionId: id, expectedRevision: 0 }).success).toBe(false);
  });

  it("aceita resposta e movimento sem aceitar correção ou pontuação do cliente", () => {
    expect(gameAnswerSchema.parse({ gameId: id, challengeId: id, clientActionId: id, expectedRevision: "3", response: " 2 ", correct: true, score: 999 })).toEqual({ gameId: id, challengeId: id, clientActionId: id, expectedRevision: 3, response: " 2 " });
    expect(gameMoveSchema.parse({ gameId: id, pieceId: "s2", clientActionId: id, expectedRevision: "4", destination: 99 })).toEqual({ gameId: id, pieceId: "s2", clientActionId: id, expectedRevision: 4 });
    expect(gameMoveSchema.safeParse({ gameId: id, pieceId: "m1", clientActionId: id, expectedRevision: 4 }).success).toBe(false);
  });

  it.each([[0, 10], [1, 7], [2, 4], [3, 1], [10, 1]])("calcula prêmio para %i erro(s)", (errors, expected) => {
    expect(awardFor(errors)).toBe(expected);
  });
});
