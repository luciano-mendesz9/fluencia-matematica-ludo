"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import type { GameDto } from "@/src/server/games/service";
import { rollGameAction, startGameAction, type GameActionState } from "./actions";

const initial: GameActionState = { status: "idle" };

export function StartGameButton({ activityId }: { activityId: string }) {
  const [state, action, pending] = useActionState(startGameAction, initial);
  return <form action={action} className="grid justify-items-start gap-2">
    <input type="hidden" name="activityId" value={activityId}/>
    <button disabled={pending} className="min-h-11 rounded-control bg-brand px-5 font-bold text-white disabled:opacity-60">{pending ? "Aguarde..." : "Iniciar partida"}</button>
    {state.message && <p role={state.status === "error" ? "alert" : "status"} className={state.status === "error" ? "text-danger" : "text-success"}>{state.message}</p>}
  </form>;
}

function positionLabel(position: GameDto["pieces"][number]["position"]): string {
  if (position.kind === "BASE") return "base";
  if (position.kind === "HOME") return "chegada";
  return `posição ${position.progress}`;
}

export function GamePanel({ activityId, game }: { activityId: string; game: GameDto }) {
  const [state, action, pending] = useActionState(rollGameAction, initial);
  const [clientActionId] = useState(() => crypto.randomUUID());
  const studentPieces = game.pieces.filter((piece) => piece.player === "STUDENT");
  return <section aria-labelledby="game-heading" className="rounded-panel border border-border bg-surface p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 id="game-heading" className="text-xl font-bold">Partida de Ludo</h2><p className="mt-1 text-sm text-muted">Revisão {game.revision} · estado salvo no servidor</p></div>
      <span className="rounded-full bg-blue-100 px-3 py-2 text-sm font-bold text-brand">{game.phase === "WAITING_FIRST_EXIT" ? "Aguardando primeiro 6" : game.phase === "CHALLENGE_PENDING" ? "Desafio pendente" : "Seu turno"}</span>
    </div>
    <ul aria-label="Posições dos seus pinos" className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{studentPieces.map((piece)=><li key={piece.id} className="rounded-control bg-blue-50 p-3 text-center"><span className="block font-bold">Pino {piece.id.slice(1)}</span><span className="text-sm text-muted">{positionLabel(piece.position)}</span></li>)}</ul>
    {game.challenge ? <article className="mt-5 rounded-control border border-brand bg-blue-50 p-4" aria-labelledby="challenge-heading">
      <p className="text-sm font-bold uppercase text-brand">Dificuldade {game.challenge.difficulty}{game.challenge.isRepeated ? " · questão repetida" : ""}</p>
      <h3 id="challenge-heading" className="mt-2 text-lg font-bold">Desafio</h3>
      {game.challenge.prompt.image && <Image src={game.challenge.prompt.image.url} alt={game.challenge.prompt.image.altText} width={640} height={320} unoptimized className="mt-3 max-h-64 rounded-control object-contain"/>}
      <p className="mt-3 text-lg">{game.challenge.prompt.statement}</p>
      {game.challenge.prompt.options.length > 0 && <ol className="mt-3 grid gap-2">{game.challenge.prompt.options.map((option)=><li key={option.id} className="rounded-control border border-border bg-surface p-3">{option.text}</li>)}</ol>}
      <p className="mt-4 text-sm text-muted">A resposta e o movimento serão conectados na FM-018.</p>
    </article> : game.status === "ACTIVE" && (game.phase === "WAITING_FIRST_EXIT" || game.phase === "STUDENT_ROLL") ? <form action={action} className="mt-5 grid justify-items-start gap-2">
      <input type="hidden" name="activityId" value={activityId}/><input type="hidden" name="gameId" value={game.id}/><input type="hidden" name="clientActionId" value={clientActionId}/><input type="hidden" name="expectedRevision" value={game.revision}/>
      <button disabled={pending} className="min-h-11 rounded-control bg-brand px-5 font-bold text-white disabled:opacity-60">{pending ? "Aguarde..." : "Lançar dado"}</button>
      {state.message && <p role={state.status === "error" ? "alert" : "status"} className={state.status === "error" ? "text-danger" : "text-success"}>{state.message}</p>}
    </form> : <p role="status" className="mt-5 font-semibold text-muted">Esta partida não aceita novos lançamentos.</p>}
  </section>;
}
