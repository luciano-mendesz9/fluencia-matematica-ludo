import {
  LUDO_PLAYERS,
  LudoDomainError,
  type BoardDefinition,
  type LudoPlayer,
  type LudoRules,
} from "./types";

export const PROPOSED_MVP_RULES: LudoRules = Object.freeze({
  requireExactHome: true,
  machineExtraRollOnSix: false,
  allowOwnPieceSharing: true,
  resetRecoveryErrorsWhenAllPlayablePiecesReturnToBase: false,
});

const REQUIRED_RULES = [
  "requireExactHome",
  "machineExtraRollOnSix",
  "allowOwnPieceSharing",
  "resetRecoveryErrorsWhenAllPlayablePiecesReturnToBase",
] as const satisfies readonly (keyof LudoRules)[];

function rotatedPath(length: number, entry: number): number[] {
  return Array.from({ length }, (_, index) => (entry + index) % length);
}

export function createBoardDefinition(input: BoardDefinition): BoardDefinition {
  const { sharedTrackLength, homeStretchLength } = input;
  if (!input.version.trim()) {
    throw new LudoDomainError("INVALID_BOARD", "A versão do tabuleiro é obrigatória.");
  }
  if (!Number.isInteger(sharedTrackLength) || sharedTrackLength < 2) {
    throw new LudoDomainError("INVALID_BOARD", "O percurso compartilhado deve ter tamanho inteiro válido.");
  }
  if (!Number.isInteger(homeStretchLength) || homeStretchLength < 1) {
    throw new LudoDomainError("INVALID_BOARD", "O corredor final deve ter tamanho inteiro positivo.");
  }

  const expectedCells = new Set(Array.from({ length: sharedTrackLength }, (_, index) => index));
  for (const player of LUDO_PLAYERS) {
    const path = input.paths[player];
    if (!path || path.length !== sharedTrackLength || new Set(path).size !== sharedTrackLength) {
      throw new LudoDomainError("INVALID_BOARD", `O caminho de ${player} deve percorrer todas as casas uma vez.`);
    }
    if (path.some((cell) => !Number.isInteger(cell) || !expectedCells.has(cell))) {
      throw new LudoDomainError("INVALID_BOARD", `O caminho de ${player} contém casa inválida.`);
    }
  }

  if (
    new Set(input.safeCells).size !== input.safeCells.length ||
    input.safeCells.some((cell) => !Number.isInteger(cell) || !expectedCells.has(cell))
  ) {
    throw new LudoDomainError("INVALID_BOARD", "As casas seguras devem ser únicas e pertencer ao percurso.");
  }

  for (const rule of REQUIRED_RULES) {
    if (typeof input.rules?.[rule] !== "boolean") {
      throw new LudoDomainError("INVALID_BOARD", `A regra ${rule} deve ser booleana.`);
    }
  }

  return Object.freeze({
    ...input,
    paths: Object.freeze({
      STUDENT: Object.freeze([...input.paths.STUDENT]),
      MACHINE: Object.freeze([...input.paths.MACHINE]),
    }),
    safeCells: Object.freeze([...input.safeCells]),
    rules: Object.freeze({ ...input.rules }),
  });
}

export const PROPOSED_MVP_BOARD = createBoardDefinition({
  version: "ludo-mvp-proposed-v1",
  sharedTrackLength: 52,
  homeStretchLength: 6,
  paths: {
    STUDENT: rotatedPath(52, 0),
    MACHINE: rotatedPath(52, 26),
  },
  safeCells: [0, 8, 13, 21, 26, 34, 39, 47],
  rules: PROPOSED_MVP_RULES,
});

export function canonicalCell(
  board: BoardDefinition,
  player: LudoPlayer,
  progress: number,
): number | null {
  return progress < board.sharedTrackLength ? board.paths[player][progress] : null;
}

export function finalTrackProgress(board: BoardDefinition): number {
  return board.sharedTrackLength + board.homeStretchLength - 1;
}
