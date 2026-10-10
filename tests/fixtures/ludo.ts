import type { BoardDefinition, GameState, LudoPlayer, PiecePosition, PieceState } from "../../src/domain/ludo";
import { PROPOSED_MVP_BOARD, createBoardDefinition } from "../../src/domain/ludo";

export const base = (): PiecePosition => ({ kind: "BASE" });
export const track = (progress: number): PiecePosition => ({ kind: "TRACK", progress });
export const home = (): PiecePosition => ({ kind: "HOME" });

export function boardWithRules(
  rules: Partial<BoardDefinition["rules"]>,
): BoardDefinition {
  return createBoardDefinition({
    ...PROPOSED_MVP_BOARD,
    version: `fixture-${Object.entries(rules).map(([key, value]) => `${key}-${value}`).join("-")}`,
    rules: { ...PROPOSED_MVP_BOARD.rules, ...rules },
  });
}

export function gameState(
  board: BoardDefinition = PROPOSED_MVP_BOARD,
  positions: Partial<Record<string, PiecePosition>> = {},
): GameState {
  const pieces: PieceState[] = (["STUDENT", "MACHINE"] as const).flatMap((player: LudoPlayer) =>
    Array.from({ length: 4 }, (_, index) => {
      const id = `${player === "STUDENT" ? "s" : "m"}${index + 1}`;
      return { id, player, position: positions[id] ?? base() };
    }),
  );
  return { boardVersion: board.version, pieces };
}
