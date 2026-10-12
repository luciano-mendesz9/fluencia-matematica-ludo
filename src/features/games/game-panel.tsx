"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { PieceState } from "@/src/domain/ludo";
import { Icon } from "@/src/components/ui/icon";
import type { GameDto, PublicMove } from "@/src/server/games/service";
import { answerGameAction, moveGameAction, rollGameAction, startGameAction, type GameActionState } from "./actions";
import { LudoBoard } from "./ludo-board";
import { movementSteps } from "./ludo-board-model";

const initial: GameActionState = { status: "idle" };

type DiceOverlayState = {
  owner: "STUDENT" | "MACHINE";
  face: number;
  finalFace: number | null;
  revealed: boolean;
  startedAt: number;
  remainingMachineRolls: Array<{ dice: number; pieceId: string | null }>;
};

export function StartGameButton({ activityId }: { activityId: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(startGameAction, initial);
  useEffect(() => { if (state.status === "success") router.push(`/aluno/atividades/${activityId}/jogo`); }, [activityId, router, state.status]);
  return <form action={action} className="grid gap-3"><input type="hidden" name="activityId" value={activityId} /><button disabled={pending} className="student-primary w-full px-5">{pending ? "Aguarde..." : <><Icon name="play" />Iniciar partida</>}</button>{state.message ? <ActionMessage state={state} /> : null}</form>;
}

function ActionMessage({ state }: { state: GameActionState }) {
  return state.message ? <p role={state.status === "error" ? "alert" : "status"} className={`rounded-xl p-3 text-sm font-bold ${state.status === "error" ? "bg-red-50 text-danger" : "bg-blue-50 text-brand"}`}>{state.message}</p> : null;
}

function phaseLabel(game: GameDto) {
  if (game.status === "SUSPENDED") return "Partida pausada";
  if (game.status === "FINISHED") return game.winner === "STUDENT" ? "Você venceu!" : "A máquina venceu";
  if (game.phase === "WAITING_FIRST_EXIT") return "Tire 6 para começar";
  if (game.phase === "RECOVERY_RELEASE") return "Tire 6 para voltar ao jogo";
  if (game.phase === "RECOVERY_ROLL") return "Nova tentativa";
  if (game.phase === "CHALLENGE_PENDING") return "Desafio matemático";
  if (game.phase === "MOVE_PENDING") return "Escolha o pino que deseja mover";
  if (game.turn === "MACHINE") return "Vez da máquina";
  return "Sua vez";
}

function Modal({ title, eyebrow, children, tone = "blue" }: { title: string; eyebrow: string; children: ReactNode; tone?: "blue" | "yellow" }) {
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const focusTarget = modalRef.current?.querySelector<HTMLElement>("[data-autofocus], input, button");
    focusTarget?.focus({ preventScroll: true });
  }, []);
  return <div className="game-modal-backdrop" role="presentation"><div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="game-modal-title" className={`game-modal game-modal-${tone}`}>
    <p className="game-modal-eyebrow">{eyebrow}</p>
    <h2 id="game-modal-title" className="game-modal-title">{title}</h2>
    {children}
  </div></div>;
}

const PIP_POSITIONS: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

function DieFace({ value, rolling = false }: { value: number; rolling?: boolean }) {
  const pips = new Set(PIP_POSITIONS[value] ?? []);
  return <div className={`game-die-face ${rolling ? "game-die-rolling" : ""}`} aria-label={`Dado ${value}`}>{Array.from({ length: 9 }, (_, index) => <span key={index} className={pips.has(index) ? "game-die-pip" : ""} />)}</div>;
}

function DiceOverlay({ state }: { state: DiceOverlayState }) {
  const student = state.owner === "STUDENT";
  return <Modal title={student ? "Girando o seu dado…" : "A máquina está jogando…"} eyebrow={student ? "Sua vez" : "Turno da máquina"} tone={student ? "blue" : "yellow"}>
    <div className="game-die-stage" aria-live="polite"><DieFace value={state.face} rolling={!state.revealed} /></div>
    <p className="mt-4 text-center font-extrabold text-muted">{state.revealed && state.finalFace !== null ? `Resultado: ${state.finalFace}` : "Sorteando um valor de 1 a 6…"}</p>
  </Modal>;
}

function AnswerForm({ activityId, game, online }: { activityId: string; game: GameDto; online: boolean }) {
  const [state, action, pending] = useActionState(answerGameAction, initial);
  const [actionId] = useState(() => crypto.randomUUID());
  const challenge = game.challenge!;
  return <form action={action} className="mt-4 grid gap-3">
    <input type="hidden" name="activityId" value={activityId} /><input type="hidden" name="gameId" value={game.id} /><input type="hidden" name="challengeId" value={challenge.id} /><input type="hidden" name="clientActionId" value={actionId} /><input type="hidden" name="expectedRevision" value={game.revision} />
    {challenge.prompt.answerType === "MULTIPLE_CHOICE" ? <fieldset className="game-answer-options"><legend className="sr-only">Escolha uma resposta</legend>{challenge.prompt.options.map((option, index) => <label key={option.id} className="game-answer-option"><input data-autofocus={index === 0 ? "true" : undefined} required type="radio" name="response" value={option.id} /><span>{option.text}</span></label>)}</fieldset> : <label className="grid gap-2 font-extrabold">Sua resposta<input data-autofocus required name="response" inputMode="decimal" autoComplete="off" placeholder="Digite um número" className="game-number-answer" /></label>}
    <button disabled={pending || !online} className="student-primary w-full px-4">{pending ? "Aguarde..." : online ? "Confirmar resposta e mover peças" : "Sem conexão"}</button><ActionMessage state={state} />
  </form>;
}

function RollForm({ activityId, game, online, pending, action, onStart, label = "Girar o dado" }: { activityId: string; game: GameDto; online: boolean; pending: boolean; action: (payload: FormData) => void; onStart: () => void; label?: string }) {
  const [clientActionId] = useState(() => crypto.randomUUID());
  const accessibleLabel = !online ? "Sem conexão" : label === "Girar o dado" ? "Jogar dado" : label;
  return <form action={action} onSubmit={onStart} className="grid gap-3"><input type="hidden" name="activityId" value={activityId} /><input type="hidden" name="gameId" value={game.id} /><input type="hidden" name="clientActionId" value={clientActionId} /><input type="hidden" name="expectedRevision" value={game.revision} /><button data-autofocus aria-label={accessibleLabel} disabled={pending || !online} className="student-primary game-roll-button px-5">{pending ? "Aguarde..." : online ? <><span aria-hidden="true">🎲</span>{label}</> : "Sem conexão"}</button></form>;
}

function samePosition(left: PieceState["position"], right: PieceState["position"]) { return left.kind === right.kind && (left.kind !== "TRACK" || (right.kind === "TRACK" && left.progress === right.progress)); }
const delay = (milliseconds: number) => new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

export function GamePanel({ activityId, game, progress }: { activityId: string; game: GameDto; progress: { accepted: number; target: number; extra: number } }) {
  const router = useRouter();
  const [rollState, rollAction, rollPending] = useActionState(rollGameAction, initial);
  const [moveState, moveAction, movePending] = useActionState(moveGameAction, initial);
  const [online, setOnline] = useState(true);
  const [diceOverlay, setDiceOverlay] = useState<DiceOverlayState | null>(null);
  const [displayPieces, setDisplayPieces] = useState<PieceState[]>(game.pieces);
  const [movingPieceId, setMovingPieceId] = useState<string | null>(null);
  const [dismissedFeedbackRevision, setDismissedFeedbackRevision] = useState<number | null>(null);
  const displayedRef = useRef(displayPieces);
  const serverPiecesRef = useRef(game.pieces);
  const handledEvents = useRef(new Set<string>());
  const animationQueue = useRef(Promise.resolve());

  const updateDisplayed = useCallback((updater: (pieces: PieceState[]) => PieceState[]) => { const next = updater(displayedRef.current); displayedRef.current = next; setDisplayPieces(next); }, []);
  const animatePiece = useCallback(async (pieceId: string, to: PieceState["position"]) => {
    const current = displayedRef.current.find((piece) => piece.id === pieceId);
    if (!current || samePosition(current.position, to)) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMovingPieceId(pieceId);
    for (const position of movementSteps(current.position, to)) {
      updateDisplayed((pieces) => pieces.map((piece) => piece.id === pieceId ? { ...piece, position } : piece));
      if (!reducedMotion) await delay(170);
    }
    setMovingPieceId(null);
  }, [updateDisplayed]);
  const syncToServerProgressively = useCallback(() => {
    animationQueue.current = animationQueue.current.then(async () => {
      const targets = serverPiecesRef.current;
      for (const player of ["STUDENT", "MACHINE"] as const) for (const target of targets.filter((piece) => piece.player === player)) {
        const current = displayedRef.current.find((piece) => piece.id === target.id);
        if (current && !samePosition(current.position, target.position)) await animatePiece(target.id, target.position);
      }
      displayedRef.current = targets.map((piece) => ({ ...piece, position: { ...piece.position } })); setDisplayPieces(displayedRef.current);
    });
  }, [animatePiece]);

  useEffect(() => { serverPiecesRef.current = game.pieces; }, [game.pieces, game.revision]);
  useEffect(() => { const sync = () => setOnline(navigator.onLine); sync(); addEventListener("online", sync); addEventListener("offline", sync); return () => { removeEventListener("online", sync); removeEventListener("offline", sync); }; }, []);
  useEffect(() => { const refresh = () => router.refresh(); addEventListener("online", refresh); return () => removeEventListener("online", refresh); }, [router]);

  const beginStudentRoll = useCallback(() => { setDismissedFeedbackRevision(game.revision); setDiceOverlay({ owner: "STUDENT", face: 1 + Math.floor(Math.random() * 6), finalFace: null, revealed: false, startedAt: Date.now(), remainingMachineRolls: [] }); }, [game.revision]);
  const beginMachineRolls = useCallback((rolls: Array<{ dice: number; pieceId: string | null }>) => { const [first, ...remaining] = rolls; if (!first) { syncToServerProgressively(); return; } setDiceOverlay({ owner: "MACHINE", face: 1 + Math.floor(Math.random() * 6), finalFace: first.dice, revealed: false, startedAt: Date.now(), remainingMachineRolls: remaining }); }, [syncToServerProgressively]);

  useEffect(() => { const event = rollState.event; if (!event || event.kind !== "ROLL" || handledEvents.current.has(event.id)) return; handledEvents.current.add(event.id); setDiceOverlay((current) => current?.owner === "STUDENT" ? { ...current, finalFace: event.studentDice, remainingMachineRolls: event.machineRolls } : current); }, [rollState.event]);
  useEffect(() => {
    const event = moveState.event;
    if (!event || event.kind !== "MOVE" || handledEvents.current.has(event.id)) return;
    handledEvents.current.add(event.id);
    const timeout = window.setTimeout(() => { if (event.machineRolls.length) beginMachineRolls(event.machineRolls); else syncToServerProgressively(); }, 0);
    return () => window.clearTimeout(timeout);
  }, [beginMachineRolls, moveState.event, syncToServerProgressively]);
  const diceSequenceKey = diceOverlay ? `${diceOverlay.owner}:${diceOverlay.startedAt}` : null;
  useEffect(() => {
    if (!diceSequenceKey) return;
    const interval = window.setInterval(() => setDiceOverlay((current) => {
      if (!current) return null;
      const elapsed = Date.now() - current.startedAt;
      if (current.finalFace !== null && elapsed >= 3000) {
        return current.face === current.finalFace && current.revealed ? current : { ...current, face: current.finalFace, revealed: true };
      }
      return { ...current, face: 1 + Math.floor(Math.random() * 6) };
    }), 90);
    return () => window.clearInterval(interval);
  }, [diceSequenceKey]);
  useEffect(() => {
    if (!diceOverlay || diceOverlay.finalFace === null || !diceOverlay.revealed) return;
    const timeout = window.setTimeout(() => { const machineRolls = diceOverlay.remainingMachineRolls; const owner = diceOverlay.owner; setDiceOverlay(null); if (machineRolls.length) beginMachineRolls(machineRolls); else if (owner === "MACHINE" || !game.challenge) syncToServerProgressively(); }, 650);
    return () => window.clearTimeout(timeout);
  }, [beginMachineRolls, diceOverlay, game.challenge, syncToServerProgressively]);
  useEffect(() => {
    if (rollState.status !== "error" && moveState.status !== "error") return;
    const timeout = window.setTimeout(() => { setDiceOverlay(null); setMovingPieceId(null); displayedRef.current = game.pieces; setDisplayPieces(game.pieces); }, 0);
    return () => window.clearTimeout(timeout);
  }, [game.pieces, moveState.status, rollState.status]);
  useEffect(() => { if (diceOverlay || rollPending || movePending || movingPieceId) return; if (rollState.status === "idle" && moveState.status === "idle") syncToServerProgressively(); }, [diceOverlay, game.revision, movePending, moveState.status, movingPieceId, rollPending, rollState.status, syncToServerProgressively]);

  const onMoveStart = useCallback((move: PublicMove) => { animationQueue.current = animationQueue.current.then(() => animatePiece(move.pieceId, move.to)); }, [animatePiece]);
  const progressValue = Math.min(progress.accepted, progress.target); const percentage = Math.min(100, Math.round((progressValue / progress.target) * 100));
  const canRoll = game.status === "ACTIVE" && ["WAITING_FIRST_EXIT", "STUDENT_ROLL", "RECOVERY_ROLL", "RECOVERY_RELEASE"].includes(game.phase);
  const showQuestion = Boolean(game.challenge) && !diceOverlay;
  const showWrongFeedback = game.feedback?.outcome === "INCORRECT" && dismissedFeedbackRevision !== game.revision && !diceOverlay;

  return <section aria-labelledby="game-heading" className="game-stage">
    <h1 id="game-heading" className="sr-only">Partida de Ludo</h1>
    <div className="game-topbar"><Link href={`/aluno/atividades/${activityId}`} className="game-back-link" aria-label="Voltar à missão"><Icon name="arrow-left" /></Link><div className="game-status-pill"><span className="game-status-dot" />{phaseLabel(game)}</div><button onClick={() => router.refresh()} className="game-refresh-button" aria-label="Reconectar estado"><span aria-hidden="true">↻</span></button></div>
    {!online ? <p role="status" className="game-offline-banner">Sem conexão. As ações estão desativadas; reconectaremos ao estado salvo quando a internet voltar.</p> : null}
    <div className="game-board-area">
      <LudoBoard activityId={activityId} gameId={game.id} revision={game.revision} pieces={displayPieces} legalMoves={game.phase === "MOVE_PENDING" ? game.legalMoves : []} moveAction={moveAction} onMoveStart={onMoveStart} online={online && !movePending} movingPieceId={movingPieceId} />
      <div className="game-hud game-hud-progress"><span className="game-hud-label">Missão</span><strong>{progressValue}/{progress.target}</strong><span className="game-hud-progress-bar"><span style={{ width: `${percentage}%` }} /></span></div>
      <div className="game-hud game-hud-points"><span className="game-hud-label">Pontos</span><strong>{game.points.activity}</strong></div>
      {game.errorCount ? <div className="game-hud game-hud-errors"><span className="game-hud-label">Próximo acerto</span><strong>+{Math.max(1, 10 - 3 * game.errorCount)}</strong></div> : null}
      {canRoll && !showWrongFeedback && !diceOverlay ? <div className="game-roll-control"><RollForm key={game.revision} activityId={activityId} game={game} online={online} pending={rollPending} action={rollAction} onStart={beginStudentRoll} /></div> : null}
      {game.phase === "MOVE_PENDING" ? <p role="status" className="game-move-instruction">Resposta correta! +{game.feedback?.awardedPoints ?? 0} pontos. Clique em um dos pinos que estão piscando.</p> : null}
    </div>
    {rollState.status === "error" ? <div className="game-action-error"><ActionMessage state={rollState} /></div> : null}{moveState.status === "error" ? <div className="game-action-error"><ActionMessage state={moveState} /></div> : null}
    {diceOverlay ? <DiceOverlay state={diceOverlay} /> : null}
    {showQuestion && game.challenge ? <Modal title={game.challenge.prompt.statement} eyebrow={`Desafio · dificuldade ${game.challenge.difficulty}`}>{game.challenge.isRepeated ? <p className="mb-2 text-sm font-bold text-warning">Esta questão já apareceu nesta partida.</p> : null}<AnswerForm key={game.challenge.id} activityId={activityId} game={game} online={online} /></Modal> : null}
    {showWrongFeedback ? <Modal title="Ainda não. Vamos tentar outra vez!" eyebrow="Nova tentativa" tone="yellow"><Feedback game={game} />{canRoll ? <div className="mt-5"><RollForm key={`retry-${game.revision}`} activityId={activityId} game={game} online={online} pending={rollPending} action={rollAction} onStart={beginStudentRoll} label="Tentar novamente" /></div> : null}</Modal> : null}
    {game.status === "FINISHED" && !diceOverlay ? <Modal title={game.winner === "STUDENT" ? "Você venceu a partida!" : "A máquina venceu desta vez"} eyebrow="Partida concluída" tone={game.winner === "STUDENT" ? "blue" : "yellow"}><div className="py-4 text-center"><span aria-hidden="true" className="text-6xl">{game.winner === "STUDENT" ? "🏆" : "🎲"}</span><p className="mt-4 font-bold text-muted">Seu progresso e seus pontos já estão salvos.</p><Link href={`/aluno/atividades/${activityId}`} className="student-primary mt-5 px-5">Voltar à missão</Link></div></Modal> : null}
  </section>;
}

function Feedback({ game }: { game: GameDto }) { if (!game.feedback) return null; const correct = game.feedback.outcome === "CORRECT"; return <div role="status" className={`rounded-xl p-4 ${correct ? "bg-emerald-50 text-emerald-950" : "bg-amber-50 text-amber-950"}`}><p className="font-black">{correct ? `Resposta correta! +${game.feedback.awardedPoints} pontos` : "Confira a resposta antes da nova tentativa."}</p><p className="mt-2 text-sm">Resposta correta: <strong>{game.feedback.correctAnswer}</strong></p>{game.feedback.explanation ? <p className="mt-2 text-sm">{game.feedback.explanation}</p> : null}</div>; }
