"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { Icon } from "@/src/components/ui/icon";
import type { GameDto } from "@/src/server/games/service";
import { rollGameAction, startGameAction, type GameActionState } from "./actions";

const initial: GameActionState = { status: "idle" };

export function StartGameButton({ activityId }: { activityId: string }) {
  const [state, action, pending] = useActionState(startGameAction, initial);
  return <form action={action} className="grid gap-3">
    <input type="hidden" name="activityId" value={activityId} />
    <button disabled={pending} className="student-primary w-full px-5">{pending ? "Aguarde..." : <><Icon name="play" />Iniciar partida</>}</button>
    {state.message ? <p role={state.status === "error" ? "alert" : "status"} className={`rounded-xl p-3 text-sm font-bold ${state.status === "error" ? "bg-red-50 text-danger" : "bg-emerald-50 text-success"}`}>{state.message}</p> : null}
  </form>;
}

function positionLabel(position: GameDto["pieces"][number]["position"]): string {
  if (position.kind === "BASE") return "na base";
  if (position.kind === "HOME") return "na chegada";
  return `na casa ${position.progress + 1}`;
}

function phaseLabel(game: GameDto) {
  if (game.status === "SUSPENDED") return "Partida pausada";
  if (game.status === "FINISHED" || game.phase === "FINISHED") return "Partida encerrada";
  if (game.phase === "WAITING_FIRST_EXIT") return "Tire 6 para começar";
  if (game.phase === "CHALLENGE_PENDING") return "Desafio matemático";
  if (game.turn === "MACHINE") return "Vez da máquina";
  return "Sua vez";
}

function Piece({ id, player, muted = false }: { id: string; player: "STUDENT" | "MACHINE"; muted?: boolean }) {
  return <span title={`${player === "STUDENT" ? "Seu" : "Máquina"} pino ${id.slice(1)}`} className={`grid size-8 place-items-center text-sm font-black shadow-sm ${player === "STUDENT" ? "rounded-full bg-brand text-white" : "rotate-45 rounded-[0.4rem] bg-[#f7c948] text-[#4b3600]"} ${muted ? "opacity-20" : ""}`}><span className={player === "MACHINE" ? "-rotate-45" : ""}>{id.slice(1)}</span></span>;
}

function StudentGameBoard({ game }: { game: GameDto }) {
  const students = game.pieces.filter((piece) => piece.player === "STUDENT");
  const machine = game.pieces.filter((piece) => piece.player === "MACHINE");
  const active = game.pieces.filter((piece) => piece.position.kind === "TRACK");
  const home = game.pieces.filter((piece) => piece.position.kind === "HOME");
  return <div>
    <div className="student-card aspect-square w-full p-3 sm:p-5" aria-hidden="true"><div className="grid h-full grid-cols-3 grid-rows-3 gap-2 rounded-[1.1rem] bg-[#f4f7fc] p-2">
      <div className="grid grid-cols-2 place-content-center gap-2 rounded-2xl bg-[#fff4dc] p-2">{machine.map((piece) => <Piece key={piece.id} id={piece.id} player="MACHINE" muted={piece.position.kind !== "BASE"} />)}</div>
      <div className="grid place-items-center rounded-xl bg-white text-amber-600">★</div>
      <div className="grid place-items-center rounded-2xl bg-amber-50"><span className="text-xs font-black text-amber-800">MÁQUINA</span></div>
      <div className="grid place-items-center rounded-xl bg-white text-brand">★</div>
      <div className="relative grid place-items-center overflow-hidden rounded-2xl bg-[#eaf1fe]"><span className="text-4xl text-brand/20">✦</span><div className="absolute inset-2 flex flex-wrap content-center justify-center gap-1.5">{active.map((piece) => <Piece key={piece.id} id={piece.id} player={piece.player} />)}{home.map((piece) => <Piece key={piece.id} id={piece.id} player={piece.player} />)}</div></div>
      <div className="grid place-items-center rounded-xl bg-white text-amber-600">★</div>
      <div className="grid place-items-center rounded-2xl bg-blue-50"><span className="text-xs font-black text-brand">VOCÊ</span></div>
      <div className="grid place-items-center rounded-xl bg-white text-brand">★</div>
      <div className="grid grid-cols-2 place-content-center gap-2 rounded-2xl bg-[#eaf3ff] p-2">{students.map((piece) => <Piece key={piece.id} id={piece.id} player="STUDENT" muted={piece.position.kind !== "BASE"} />)}</div>
    </div></div>
    <ul className="sr-only" aria-label="Posições dos pinos">{game.pieces.map((piece) => <li key={piece.id}>{piece.player === "STUDENT" ? "Seu" : "Máquina"} pino {piece.id.slice(1)}: {positionLabel(piece.position)}</li>)}</ul>
    <p className="mt-2 text-center text-xs font-bold text-muted"><span className="text-brand">●</span> seus pinos · <span className="text-amber-500">◆</span> máquina · ★ casa segura</p>
  </div>;
}

export function GamePanel({ activityId, game, progress }: { activityId: string; game: GameDto; progress: { accepted: number; target: number; extra: number } }) {
  const [state, action, pending] = useActionState(rollGameAction, initial);
  const [clientActionId] = useState(() => crypto.randomUUID());
  const progressValue = Math.min(progress.accepted, progress.target);
  const percentage = Math.min(100, Math.round((progressValue / progress.target) * 100));
  const canRoll = game.status === "ACTIVE" && (game.phase === "WAITING_FIRST_EXIT" || game.phase === "STUDENT_ROLL");
  return <section aria-labelledby="game-heading" className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-black uppercase text-brand">Partida salva</p><h2 id="game-heading" className="text-2xl font-black">Partida de Ludo</h2></div><span className="rounded-full bg-blue-50 px-3 py-2 text-sm font-black text-brand">{phaseLabel(game)}</span></div>
    <div className="grid gap-4 lg:grid-cols-[220px_minmax(280px,1fr)_280px]">
      <aside className="student-card order-2 p-4 lg:order-1"><p className="text-sm font-black uppercase text-brand">Sua missão</p><p className="mt-2 font-black">{progressValue} de {progress.target} desafios</p><div className="student-progress mt-2" role="progressbar" aria-label="Meta no jogo" aria-valuemin={0} aria-valuemax={progress.target} aria-valuenow={progressValue}><span style={{ width: `${percentage}%` }} /></div><p className="mt-2 text-sm text-muted">{progress.extra} resposta(s) adicional(is)</p><div className="mt-5 rounded-xl bg-blue-50 p-3"><p className="font-black text-brand">{phaseLabel(game)}</p><p className="mt-1 text-sm text-muted">Revisão {game.revision} confirmada pelo servidor.</p></div>{game.errorCount ? <p className="mt-3 text-sm font-bold text-amber-900">Tentativas nesta sequência: {game.errorCount}</p> : null}</aside>

      <div className="order-1 min-w-0 lg:order-2"><StudentGameBoard game={game} /></div>

      <aside className="student-card order-3 p-4"><p className="text-sm font-black uppercase text-brand">Sua jogada</p>{game.challenge ? <article aria-labelledby="challenge-heading"><div className="mt-3 flex items-center gap-4"><div className="student-die" aria-label={`Dado ${game.challenge.dice}`}>{game.challenge.dice}</div><div><p className="text-sm font-black">Carta do desafio</p><p className="text-muted">Dificuldade {game.challenge.difficulty}</p></div></div><p className="mt-4 text-xs font-black uppercase text-brand">Desafio{game.challenge.isRepeated ? " · questão repetida" : ""}</p><h3 id="challenge-heading" className="sr-only">Desafio</h3>{game.challenge.prompt.image ? <Image src={game.challenge.prompt.image.url} alt={game.challenge.prompt.image.altText} width={640} height={320} unoptimized className="mt-3 max-h-52 w-full rounded-xl object-contain" /> : null}<p className="mt-2 text-lg font-black leading-7">{game.challenge.prompt.statement}</p>{game.challenge.prompt.options.length ? <ol className="mt-4 grid gap-2">{game.challenge.prompt.options.map((option) => <li key={option.id} className="rounded-xl border border-[#d9e1ec] bg-white p-3 font-bold">{option.text}</li>)}</ol> : null}<div className="mt-4 rounded-xl bg-[#f5f8fd] p-3 text-sm text-muted"><p className="font-bold text-foreground">Desafio pronto e salvo</p><p className="mt-1">Responder e mover o pino serão liberados na próxima etapa do jogo.</p></div></article> : <><p className="mt-2 font-bold">{game.phase === "WAITING_FIRST_EXIT" ? "Jogue o dado. Você precisa tirar 6 para liberar o primeiro pino." : "Sua partida está pronta. Jogue o dado para continuar."}</p><div className="mt-4 flex items-center gap-4"><div className="student-die" aria-label="Dado ainda não jogado">?</div><div><p className="text-sm font-black">Carta do desafio</p><p className="text-sm text-muted">A dificuldade vem do dado.</p></div></div>{canRoll ? <form action={action} className="mt-5 grid gap-3"><input type="hidden" name="activityId" value={activityId} /><input type="hidden" name="gameId" value={game.id} /><input type="hidden" name="clientActionId" value={clientActionId} /><input type="hidden" name="expectedRevision" value={game.revision} /><button disabled={pending} className="student-primary w-full px-4">{pending ? "Aguarde..." : "Jogar dado"}</button>{state.message ? <p role={state.status === "error" ? "alert" : "status"} className={`rounded-xl p-3 text-sm font-bold ${state.status === "error" ? "bg-red-50 text-danger" : "bg-blue-50 text-brand"}`}>{state.message}</p> : null}</form> : <p role="status" className="mt-5 rounded-xl bg-slate-100 p-3 font-bold text-muted">Esta partida não aceita novos lançamentos.</p>}</>}</aside>
    </div>
  </section>;
}
