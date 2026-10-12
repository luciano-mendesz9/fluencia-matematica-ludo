"use client";

import { useState, type CSSProperties } from "react";
import type { PieceState } from "@/src/domain/ludo";
import type { PublicMove } from "@/src/server/games/service";
import {
  colorOrderForGame,
  coordinateForPiece,
  cornerForCell,
  homeCornerForCell,
  playerColor,
  SAFE_TRACK_CELLS,
  trackIndexAt,
  type BoardColor,
  type BoardCorner,
} from "./ludo-board-model";

type MoveDispatch = (payload: FormData) => void;

type BoardProps = {
  activityId: string;
  gameId: string;
  revision: number;
  pieces: PieceState[];
  legalMoves: PublicMove[];
  moveAction: MoveDispatch;
  onMoveStart: (move: PublicMove) => void;
  online: boolean;
  movingPieceId: string | null;
};

function cssColor(color: BoardColor) {
  return {
    "--cell-color": color.fill,
    "--cell-color-dark": color.dark,
    "--cell-color-soft": color.soft,
    "--cell-color-ink": color.ink,
  } as CSSProperties;
}

function innerYard(row: number, column: number, corner: BoardCorner) {
  if (corner === "top-left") return row >= 1 && row <= 4 && column >= 1 && column <= 4;
  if (corner === "top-right") return row >= 1 && row <= 4 && column >= 10 && column <= 13;
  if (corner === "bottom-right") return row >= 10 && row <= 13 && column >= 10 && column <= 13;
  return row >= 10 && row <= 13 && column >= 1 && column <= 4;
}

function startCorner(index: number): BoardCorner | null {
  if (index === 0) return "bottom-left";
  if (index === 13) return "top-left";
  if (index === 26) return "top-right";
  if (index === 39) return "bottom-right";
  return null;
}

function BoardCell({ row, column, colors }: { row: number; column: number; colors: Readonly<Record<BoardCorner, BoardColor>> }) {
  const trackIndex = trackIndexAt(row, column);
  const baseCorner = cornerForCell(row, column);
  const homeCorner = homeCornerForCell(row, column);
  const entryCorner = startCorner(trackIndex);
  const center = row >= 6 && row <= 8 && column >= 6 && column <= 8;
  const classes = ["ludo-cell"];
  let color: BoardColor | null = null;
  if (center) classes.push("ludo-cell-center");
  else if (trackIndex >= 0) {
    classes.push("ludo-cell-track");
    if (entryCorner) { classes.push("ludo-cell-start"); color = colors[entryCorner]; }
  } else if (homeCorner) { classes.push("ludo-cell-home-path"); color = colors[homeCorner]; }
  else if (baseCorner) {
    classes.push("ludo-cell-base");
    color = colors[baseCorner];
    if (innerYard(row, column, baseCorner)) classes.push("ludo-cell-yard");
  } else classes.push("ludo-cell-blank");
  return <div className={classes.join(" ")} style={color ? cssColor(color) : undefined} aria-hidden="true">
    {trackIndex >= 0 && SAFE_TRACK_CELLS.has(trackIndex) ? <span className="ludo-safe-star">★</span> : null}
  </div>;
}

function PieceToken({
  piece,
  gameId,
  activityId,
  revision,
  move,
  moveAction,
  onMoveStart,
  online,
  moving,
}: {
  piece: PieceState;
  gameId: string;
  activityId: string;
  revision: number;
  move: PublicMove | undefined;
  moveAction: MoveDispatch;
  onMoveStart: (move: PublicMove) => void;
  online: boolean;
  moving: boolean;
}) {
  const [actionId] = useState(() => crypto.randomUUID());
  const [row, column] = coordinateForPiece(piece);
  const color = playerColor(gameId, piece.player);
  const label = `${piece.player === "STUDENT" ? "Seu" : "Máquina"} pino ${piece.id.slice(1)}`;
  const positionStyle = {
    left: `${((column + 0.5) / 15) * 100}%`,
    top: `${((row + 0.5) / 15) * 100}%`,
    "--piece-fill": color.fill,
    "--piece-dark": color.dark,
    "--piece-ink": color.ink,
  } as CSSProperties;
  const token = <span className={`ludo-piece-token ${piece.player === "MACHINE" ? "ludo-piece-machine" : ""}`} aria-hidden="true"><span>{piece.id.slice(1)}</span></span>;

  if (!move) return <div className={`ludo-piece ${moving ? "ludo-piece-moving" : ""}`} style={positionStyle} title={`${label}, ${positionLabel(piece.position)}`}><span className="sr-only">{label}: {positionLabel(piece.position)}</span>{token}</div>;
  return <form
    action={moveAction}
    onSubmit={() => onMoveStart(move)}
    className={`ludo-piece ludo-piece-legal ${moving ? "ludo-piece-moving" : ""}`}
    style={positionStyle}
  >
    <input type="hidden" name="activityId" value={activityId} />
    <input type="hidden" name="gameId" value={gameId} />
    <input type="hidden" name="pieceId" value={move.pieceId} />
    <input type="hidden" name="clientActionId" value={actionId} />
    <input type="hidden" name="expectedRevision" value={revision} />
    <button disabled={!online || moving} aria-label={`Mover pino ${piece.id.slice(1)} para ${positionLabel(move.to)}${move.captures.length ? " e capturar" : ""}`} className="ludo-piece-button">
      {token}
    </button>
  </form>;
}

function positionLabel(position: PieceState["position"]) {
  if (position.kind === "BASE") return "na base";
  if (position.kind === "HOME") return "na chegada";
  return `na casa ${position.progress + 1}`;
}

export function LudoBoard(props: BoardProps) {
  const colors = colorOrderForGame(props.gameId);
  const cells = Array.from({ length: 225 }, (_, index) => ({ row: Math.floor(index / 15), column: index % 15 }));
  const legalByPiece = new Map(props.legalMoves.map((move) => [move.pieceId, move]));
  return <section className="ludo-board-shell" aria-label="Tabuleiro de Ludo">
    <div
      className="ludo-board"
      style={{
        "--top-left": colors["top-left"].fill,
        "--top-right": colors["top-right"].fill,
        "--bottom-right": colors["bottom-right"].fill,
        "--bottom-left": colors["bottom-left"].fill,
      } as CSSProperties}
    >
      {cells.map(({ row, column }) => <BoardCell key={`${row}-${column}`} row={row} column={column} colors={colors} />)}
      <div className="ludo-center-goal" aria-hidden="true">
        <span className="ludo-goal-triangle ludo-goal-left" />
        <span className="ludo-goal-triangle ludo-goal-top" />
        <span className="ludo-goal-triangle ludo-goal-right" />
        <span className="ludo-goal-triangle ludo-goal-bottom" />
      </div>
      <span className="ludo-player-label ludo-player-machine" style={cssColor(colors["top-right"])}>MÁQUINA</span>
      <span className="ludo-player-label ludo-player-student" style={cssColor(colors["bottom-left"])}>VOCÊ</span>
      {props.pieces.map((piece) => <PieceToken
        key={`${piece.id}-${props.revision}`}
        piece={piece}
        gameId={props.gameId}
        activityId={props.activityId}
        revision={props.revision}
        move={legalByPiece.get(piece.id)}
        moveAction={props.moveAction}
        onMoveStart={props.onMoveStart}
        online={props.online}
        moving={props.movingPieceId === piece.id}
      />)}
    </div>
    <p className="sr-only">Sua base permanece no canto inferior esquerdo. A base da máquina permanece no canto superior direito. As cores desta partida são {colors["bottom-left"].label} para você e {colors["top-right"].label} para a máquina.</p>
    <ul className="sr-only" aria-label="Posições dos pinos">{props.pieces.map((piece) => <li key={piece.id}>{piece.player === "STUDENT" ? "Seu" : "Máquina"} pino {piece.id.slice(1)}: {positionLabel(piece.position)}</li>)}</ul>
  </section>;
}
