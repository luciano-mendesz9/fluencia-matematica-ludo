import { describe, expect, it } from "vitest";
import { gameRollSchema, gameStartSchema } from "../../src/features/games/schemas";

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
});
