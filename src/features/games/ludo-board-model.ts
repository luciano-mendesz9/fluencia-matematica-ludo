import type { PieceState } from "@/src/domain/ludo";

export type BoardColorName = "green" | "yellow" | "blue" | "red";
export type BoardCorner = "top-left" | "top-right" | "bottom-right" | "bottom-left";
export type BoardCoordinate = readonly [row: number, column: number];

export type BoardColor = {
  name: BoardColorName;
  label: string;
  fill: string;
  dark: string;
  soft: string;
  ink: string;
};

export const BOARD_COLORS: Readonly<Record<BoardColorName, BoardColor>> = Object.freeze({
  green: { name: "green", label: "verde", fill: "#10b966", dark: "#087a43", soft: "#dff8eb", ink: "#063b25" },
  yellow: { name: "yellow", label: "amarelo", fill: "#ffd52f", dark: "#b88300", soft: "#fff7ca", ink: "#4b3600" },
  blue: { name: "blue", label: "azul", fill: "#246be8", dark: "#1648a6", soft: "#e2edff", ink: "#ffffff" },
  red: { name: "red", label: "vermelho", fill: "#f04452", dark: "#b92031", soft: "#ffe5e8", ink: "#ffffff" },
});

const COLOR_NAMES = ["green", "yellow", "blue", "red"] as const;

export const TRACK_COORDINATES: readonly BoardCoordinate[] = Object.freeze([
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0],
  [6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7],
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14],
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7], [14, 6],
]);

export const SAFE_TRACK_CELLS = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

const HOME_STRETCH: Readonly<Record<BoardCorner, readonly BoardCoordinate[]>> = Object.freeze({
  "top-left": Object.freeze([[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]] as const),
  "top-right": Object.freeze([[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]] as const),
  "bottom-right": Object.freeze([[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]] as const),
  "bottom-left": Object.freeze([[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]] as const),
});

const BASE_SLOTS: Readonly<Record<"STUDENT" | "MACHINE", readonly BoardCoordinate[]>> = Object.freeze({
  STUDENT: Object.freeze([[10, 2], [10, 4], [12, 2], [12, 4]] as const),
  MACHINE: Object.freeze([[2, 10], [2, 12], [4, 10], [4, 12]] as const),
});

const HOME_SLOTS: Readonly<Record<"STUDENT" | "MACHINE", readonly BoardCoordinate[]>> = Object.freeze({
  STUDENT: Object.freeze([[7.72, 6.72], [7.72, 7.28], [8.28, 6.72], [8.28, 7.28]] as const),
  MACHINE: Object.freeze([[6.72, 6.72], [6.72, 7.28], [7.28, 6.72], [7.28, 7.28]] as const),
});

function stableHash(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function nextSeed(seed: number) {
  return (Math.imul(seed, 1664525) + 1013904223) >>> 0;
}

export function colorOrderForGame(gameId: string): Readonly<Record<BoardCorner, BoardColor>> {
  const colors = [...COLOR_NAMES];
  let seed = stableHash(gameId);
  for (let index = colors.length - 1; index > 0; index -= 1) {
    seed = nextSeed(seed);
    const target = seed % (index + 1);
    [colors[index], colors[target]] = [colors[target]!, colors[index]!];
  }
  return {
    "top-left": BOARD_COLORS[colors[0]!],
    "top-right": BOARD_COLORS[colors[1]!],
    "bottom-right": BOARD_COLORS[colors[2]!],
    "bottom-left": BOARD_COLORS[colors[3]!],
  };
}

export function playerCorner(player: "STUDENT" | "MACHINE"): BoardCorner {
  return player === "STUDENT" ? "bottom-left" : "top-right";
}

export function playerColor(gameId: string, player: "STUDENT" | "MACHINE") {
  return colorOrderForGame(gameId)[playerCorner(player)];
}

export function canonicalTrackCell(player: "STUDENT" | "MACHINE", progress: number) {
  return (progress + (player === "STUDENT" ? 0 : 26)) % TRACK_COORDINATES.length;
}

export function coordinateForPiece(piece: PieceState): BoardCoordinate {
  const pieceIndex = Math.max(0, Number.parseInt(piece.id.slice(1), 10) - 1);
  if (piece.position.kind === "BASE") return BASE_SLOTS[piece.player][pieceIndex] ?? BASE_SLOTS[piece.player][0]!;
  if (piece.position.kind === "HOME") return HOME_SLOTS[piece.player][pieceIndex] ?? HOME_SLOTS[piece.player][0]!;
  if (piece.position.progress < TRACK_COORDINATES.length) {
    return TRACK_COORDINATES[canonicalTrackCell(piece.player, piece.position.progress)]!;
  }
  const homeIndex = Math.min(5, piece.position.progress - TRACK_COORDINATES.length);
  return HOME_STRETCH[playerCorner(piece.player)][homeIndex]!;
}

export function movementSteps(
  from: PieceState["position"],
  to: PieceState["position"],
): PieceState["position"][] {
  if (to.kind === "BASE") return [{ kind: "BASE" }];
  if (from.kind === "BASE") return to.kind === "TRACK" ? [{ kind: "TRACK", progress: to.progress }] : [to];
  if (from.kind === "HOME") return [to];
  const lastProgress = to.kind === "TRACK" ? to.progress : TRACK_COORDINATES.length + 5;
  const steps: PieceState["position"][] = [];
  for (let progress = from.progress + 1; progress <= lastProgress; progress += 1) {
    steps.push({ kind: "TRACK", progress });
  }
  if (to.kind === "HOME") steps.push({ kind: "HOME" });
  return steps.length ? steps : [to];
}

export function cornerForCell(row: number, column: number): BoardCorner | null {
  if (row <= 5 && column <= 5) return "top-left";
  if (row <= 5 && column >= 9) return "top-right";
  if (row >= 9 && column >= 9) return "bottom-right";
  if (row >= 9 && column <= 5) return "bottom-left";
  return null;
}

export function homeCornerForCell(row: number, column: number): BoardCorner | null {
  for (const [corner, coordinates] of Object.entries(HOME_STRETCH) as Array<[BoardCorner, readonly BoardCoordinate[]]>) {
    if (coordinates.some(([cellRow, cellColumn]) => cellRow === row && cellColumn === column)) return corner;
  }
  return null;
}

export function trackIndexAt(row: number, column: number) {
  return TRACK_COORDINATES.findIndex(([cellRow, cellColumn]) => cellRow === row && cellColumn === column);
}
