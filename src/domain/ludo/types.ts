export const LUDO_PLAYERS = ["STUDENT", "MACHINE"] as const;

export type LudoPlayer = (typeof LUDO_PLAYERS)[number];

export type PiecePosition =
  | { readonly kind: "BASE" }
  | { readonly kind: "TRACK"; readonly progress: number }
  | { readonly kind: "HOME" };

export interface PieceState {
  readonly id: string;
  readonly player: LudoPlayer;
  readonly position: PiecePosition;
}

export interface LudoRules {
  readonly requireExactHome: boolean;
  readonly machineExtraRollOnSix: boolean;
  readonly allowOwnPieceSharing: boolean;
  readonly resetRecoveryErrorsWhenAllPlayablePiecesReturnToBase: boolean;
}

export interface BoardDefinition {
  readonly version: string;
  readonly sharedTrackLength: number;
  readonly homeStretchLength: number;
  readonly paths: Readonly<Record<LudoPlayer, readonly number[]>>;
  readonly safeCells: readonly number[];
  readonly rules: LudoRules;
}

export interface GameState {
  readonly boardVersion: string;
  readonly pieces: readonly PieceState[];
}

export interface LegalMove {
  readonly player: LudoPlayer;
  readonly pieceId: string;
  readonly dice: number;
  readonly from: PiecePosition;
  readonly to: PiecePosition;
  readonly capturedPieceIds: readonly string[];
}

export interface MoveTransition {
  readonly state: GameState;
  readonly move: LegalMove;
  readonly winner: LudoPlayer | null;
}

export type LudoDomainErrorCode =
  | "INVALID_BOARD"
  | "INVALID_STATE"
  | "INVALID_DICE"
  | "ILLEGAL_MOVE";

export class LudoDomainError extends Error {
  constructor(
    readonly code: LudoDomainErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "LudoDomainError";
  }
}
