import { canonicalCell, createBoardDefinition, finalTrackProgress } from "./board";
import {
  LUDO_PLAYERS,
  LudoDomainError,
  type BoardDefinition,
  type GameState,
  type LegalMove,
  type LudoPlayer,
  type MoveTransition,
  type PiecePosition,
  type PieceState,
} from "./types";

const PIECES_PER_PLAYER = 4;

function compareIds(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function samePosition(left: PiecePosition, right: PiecePosition): boolean {
  return left.kind === right.kind &&
    (left.kind !== "TRACK" || (right.kind === "TRACK" && left.progress === right.progress));
}

function assertDice(dice: number): void {
  if (!Number.isInteger(dice) || dice < 1 || dice > 6) {
    throw new LudoDomainError("INVALID_DICE", "O dado deve ser um inteiro entre 1 e 6.");
  }
}

function occupiedCell(board: BoardDefinition, piece: PieceState): number | null {
  return piece.position.kind === "TRACK"
    ? canonicalCell(board, piece.player, piece.position.progress)
    : null;
}

function positionsCollide(
  board: BoardDefinition,
  left: PieceState,
  right: PieceState,
): boolean {
  if (left.position.kind !== "TRACK" || right.position.kind !== "TRACK") return false;
  const leftCell = occupiedCell(board, left);
  const rightCell = occupiedCell(board, right);
  if (leftCell !== null && rightCell !== null) return leftCell === rightCell;
  return left.player === right.player && left.position.progress === right.position.progress;
}

export function assertValidGameState(boardInput: BoardDefinition, state: GameState): void {
  const board = createBoardDefinition(boardInput);
  if (state.boardVersion !== board.version) {
    throw new LudoDomainError("INVALID_STATE", "A versão do estado não corresponde ao tabuleiro.");
  }
  if (state.pieces.length !== PIECES_PER_PLAYER * LUDO_PLAYERS.length) {
    throw new LudoDomainError("INVALID_STATE", "O estado deve conter quatro pinos por jogador.");
  }
  if (new Set(state.pieces.map((piece) => piece.id)).size !== state.pieces.length) {
    throw new LudoDomainError("INVALID_STATE", "Os identificadores dos pinos devem ser únicos.");
  }

  for (const player of LUDO_PLAYERS) {
    if (state.pieces.filter((piece) => piece.player === player).length !== PIECES_PER_PLAYER) {
      throw new LudoDomainError("INVALID_STATE", `O jogador ${player} deve ter quatro pinos.`);
    }
  }

  const maximumProgress = finalTrackProgress(board);
  for (const piece of state.pieces) {
    if (
      piece.position.kind === "TRACK" &&
      (!Number.isInteger(piece.position.progress) ||
        piece.position.progress < 0 ||
        piece.position.progress > maximumProgress)
    ) {
      throw new LudoDomainError("INVALID_STATE", `O pino ${piece.id} possui progresso inválido.`);
    }
  }

  for (let leftIndex = 0; leftIndex < state.pieces.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < state.pieces.length; rightIndex += 1) {
      const left = state.pieces[leftIndex];
      const right = state.pieces[rightIndex];
      if (!positionsCollide(board, left, right)) continue;

      if (left.player === right.player) {
        if (!board.rules.allowOwnPieceSharing) {
          throw new LudoDomainError("INVALID_STATE", "Pinos próprios não podem compartilhar posição.");
        }
        continue;
      }

      const cell = occupiedCell(board, left);
      if (cell !== null && !board.safeCells.includes(cell)) {
        throw new LudoDomainError("INVALID_STATE", "Pinos adversários só podem coexistir em casa segura.");
      }
    }
  }
}

function destinationFor(
  board: BoardDefinition,
  position: PiecePosition,
  dice: number,
): PiecePosition | null {
  if (position.kind === "HOME") return null;
  if (position.kind === "BASE") return dice === 6 ? { kind: "TRACK", progress: 0 } : null;

  const homeProgress = finalTrackProgress(board) + 1;
  const destination = position.progress + dice;
  if (destination === homeProgress || (destination > homeProgress && !board.rules.requireExactHome)) {
    return { kind: "HOME" };
  }
  if (destination > homeProgress) return null;
  return { kind: "TRACK", progress: destination };
}

function destinationConflictsWithOwnPiece(
  board: BoardDefinition,
  state: GameState,
  piece: PieceState,
  destination: PiecePosition,
): boolean {
  if (board.rules.allowOwnPieceSharing || destination.kind === "HOME") return false;
  const candidate: PieceState = { ...piece, position: destination };
  return state.pieces.some(
    (other) => other.id !== piece.id && other.player === piece.player && positionsCollide(board, candidate, other),
  );
}

function capturedPieces(
  board: BoardDefinition,
  state: GameState,
  piece: PieceState,
  destination: PiecePosition,
): string[] {
  if (destination.kind !== "TRACK") return [];
  const cell = canonicalCell(board, piece.player, destination.progress);
  if (cell === null || board.safeCells.includes(cell)) return [];
  return state.pieces
    .filter((other) => other.player !== piece.player && occupiedCell(board, other) === cell)
    .map((other) => other.id)
    .sort();
}

export function winnerOf(board: BoardDefinition, state: GameState): LudoPlayer | null {
  assertValidGameState(board, state);
  return LUDO_PLAYERS.find((player) =>
    state.pieces.filter((piece) => piece.player === player).every((piece) => piece.position.kind === "HOME"),
  ) ?? null;
}

export function legalMoves(
  board: BoardDefinition,
  state: GameState,
  player: LudoPlayer,
  dice: number,
): LegalMove[] {
  assertDice(dice);
  assertValidGameState(board, state);
  if (!LUDO_PLAYERS.includes(player) || winnerOfWithoutValidation(state) !== null) return [];

  return state.pieces
    .filter((piece) => piece.player === player)
    .map((piece): LegalMove | null => {
      const destination = destinationFor(board, piece.position, dice);
      if (!destination || destinationConflictsWithOwnPiece(board, state, piece, destination)) return null;
      return {
        player,
        pieceId: piece.id,
        dice,
        from: piece.position,
        to: destination,
        capturedPieceIds: capturedPieces(board, state, piece, destination),
      };
    })
    .filter((move): move is LegalMove => move !== null)
    .sort((left, right) => compareIds(left.pieceId, right.pieceId));
}

function winnerOfWithoutValidation(state: GameState): LudoPlayer | null {
  return LUDO_PLAYERS.find((player) =>
    state.pieces.filter((piece) => piece.player === player).every((piece) => piece.position.kind === "HOME"),
  ) ?? null;
}

function sameMove(left: LegalMove, right: LegalMove): boolean {
  return left.player === right.player &&
    left.pieceId === right.pieceId &&
    left.dice === right.dice &&
    samePosition(left.from, right.from) &&
    samePosition(left.to, right.to) &&
    left.capturedPieceIds.length === right.capturedPieceIds.length &&
    left.capturedPieceIds.every((id, index) => id === right.capturedPieceIds[index]);
}

export function applyMove(
  board: BoardDefinition,
  state: GameState,
  move: LegalMove,
): MoveTransition {
  const canonicalMove = legalMoves(board, state, move.player, move.dice)
    .find((candidate) => candidate.pieceId === move.pieceId);
  if (!canonicalMove || !sameMove(canonicalMove, move)) {
    throw new LudoDomainError("ILLEGAL_MOVE", "O movimento não pertence ao estado atual.");
  }

  const capturedIds = new Set(canonicalMove.capturedPieceIds);
  const pieces = state.pieces.map((piece): PieceState => {
    if (piece.id === canonicalMove.pieceId) return { ...piece, position: canonicalMove.to };
    if (capturedIds.has(piece.id)) return { ...piece, position: { kind: "BASE" } };
    return piece;
  });
  const nextState: GameState = { boardVersion: state.boardVersion, pieces };
  assertValidGameState(board, nextState);
  return { state: nextState, move: canonicalMove, winner: winnerOfWithoutValidation(nextState) };
}

function machinePriority(move: LegalMove): number {
  if (move.to.kind === "HOME") return 4;
  if (move.capturedPieceIds.length > 0) return 3;
  if (move.from.kind === "BASE") return 2;
  return 1;
}

export function chooseMachineMove(
  board: BoardDefinition,
  state: GameState,
  dice: number,
): LegalMove | null {
  const moves = legalMoves(board, state, "MACHINE", dice);
  return moves.sort((left, right) => {
    const priority = machinePriority(right) - machinePriority(left);
    return priority || compareIds(left.pieceId, right.pieceId);
  })[0] ?? null;
}
