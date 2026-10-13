import { describe, expect, it } from "vitest";
import { colorOrderForGame, coordinateForPiece, movementSteps, TRACK_COORDINATES } from "@/src/features/games/ludo-board-model";

describe("ludo board visual model", () => {
  it("maps the complete classic 52-cell track without duplicates", () => {
    expect(TRACK_COORDINATES).toHaveLength(52);
    expect(new Set(TRACK_COORDINATES.map((coordinate) => coordinate.join(":"))).size).toBe(52);
  });

  it("keeps the student at bottom-left and machine at top-right with stable shuffled colors", () => {
    const first = colorOrderForGame("00000000-0000-0000-0000-000000000001");
    const repeated = colorOrderForGame("00000000-0000-0000-0000-000000000001");
    expect(repeated).toEqual(first);
    expect(new Set(Object.values(first).map((color) => color.name)).size).toBe(4);
    expect(coordinateForPiece({ id: "s1", player: "STUDENT", position: { kind: "BASE" } })).toEqual([10, 2]);
    expect(coordinateForPiece({ id: "m1", player: "MACHINE", position: { kind: "BASE" } })).toEqual([2, 10]);
  });

  it("builds every intermediate position for progressive movement", () => {
    expect(movementSteps({ kind: "TRACK", progress: 1 }, { kind: "TRACK", progress: 5 })).toEqual([
      { kind: "TRACK", progress: 2 },
      { kind: "TRACK", progress: 3 },
      { kind: "TRACK", progress: 4 },
      { kind: "TRACK", progress: 5 },
    ]);
  });
});
