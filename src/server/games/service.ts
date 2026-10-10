import "server-only";

import { randomInt as secureRandomInt } from "node:crypto";
import { z } from "zod";
import { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/src/lib/prisma";
import {
  PROPOSED_MVP_BOARD,
  applyMove,
  assertValidGameState,
  chooseMachineMove,
  createBoardDefinition,
  legalMoves,
  type BoardDefinition,
  type GameState,
  type LegalMove,
  type LudoRules,
  type PieceState,
} from "@/src/domain/ludo";
import { AuthorizationError } from "@/src/server/auth/errors";
import type { AuthenticatedPrincipal } from "@/src/server/auth/policies";
import { mapWrite, uuid } from "@/src/server/questions/service";

export type RandomInt = (upperExclusive: number) => number;

type PublicPosition = { kind: "BASE" } | { kind: "TRACK"; progress: number } | { kind: "HOME" };
type PublicMove = { pieceId: string; from: PublicPosition; to: PublicPosition };
type PublicChallenge = {
  id: string;
  difficulty: number;
  dice: number;
  isRepeated: boolean;
  prompt: {
    statement: string;
    answerType: "MULTIPLE_CHOICE" | "NUMERIC";
    options: Array<{ id: string; text: string; position: number }>;
    image: { url: string; altText: string } | null;
  };
};

export type GameDto = {
  id: string;
  status: "ACTIVE" | "SUSPENDED" | "FINISHED";
  phase: "WAITING_FIRST_EXIT" | "STUDENT_ROLL" | "CHALLENGE_PENDING" | "MOVE_PENDING" | "RECOVERY_ROLL" | "RECOVERY_RELEASE" | "FINISHED";
  turn: "STUDENT" | "MACHINE";
  revision: number;
  boardVersion: string;
  pieces: PieceState[];
  errorCount: number;
  challenge: PublicChallenge | null;
};

export type RollResult = {
  game: GameDto;
  roll: {
    studentDice: number;
    machineRolls: Array<{ dice: number; pieceId: string | null }>;
    candidateMoves: PublicMove[];
    noChallengeReason: "NO_LEGAL_MOVE" | "CONTENT_UNAVAILABLE" | null;
  };
  retried: boolean;
};

const positionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("BASE") }),
  z.object({ kind: z.literal("TRACK"), progress: z.number().int().min(0) }),
  z.object({ kind: z.literal("HOME") }),
]);
const piecesSchema = z.array(z.object({ id: z.string().min(1), player: z.enum(["STUDENT", "MACHINE"]), position: positionSchema })).length(8);
const rulesSchema = z.object({
  requireExactHome: z.boolean(),
  machineExtraRollOnSix: z.boolean(),
  allowOwnPieceSharing: z.boolean(),
  resetRecoveryErrorsWhenAllPlayablePiecesReturnToBase: z.boolean(),
});

const challengeSelect = {
  id: true,
  difficulty: true,
  dice: true,
  isRepeated: true,
  questionVersion: {
    select: {
      statement: true,
      answerType: true,
      options: { orderBy: { position: "asc" as const }, select: { stableId: true, text: true, position: true } },
      media: { where: { kind: "IMAGE" as const }, select: { id: true, altText: true }, take: 1 },
    },
  },
} satisfies Prisma.GameChallengeSelect;

type SelectedChallenge = Prisma.GameChallengeGetPayload<{ select: typeof challengeSelect }>;

function assertStudent(actor: AuthenticatedPrincipal): void {
  if (!actor.studentCode || actor.globalRole) throw new AuthorizationError("FORBIDDEN", "Acesso exclusivo do aluno.");
}

function validateRevision(revision: number): void {
  if (!Number.isInteger(revision) || revision < 1) throw new AuthorizationError("VALIDATION", "Revisão inválida.");
}

function nextRandom(randomInt: RandomInt, upperExclusive: number): number {
  const value = randomInt(upperExclusive);
  if (!Number.isInteger(value) || value < 0 || value >= upperExclusive) {
    throw new Error("[game] fonte aleatória retornou valor fora do intervalo.");
  }
  return value;
}

function rollDice(randomInt: RandomInt): number {
  return nextRandom(randomInt, 6) + 1;
}

function initialState(): GameState {
  const pieces: PieceState[] = (["STUDENT", "MACHINE"] as const).flatMap((player) =>
    Array.from({ length: 4 }, (_, index) => ({
      id: `${player === "STUDENT" ? "s" : "m"}${index + 1}`,
      player,
      position: { kind: "BASE" as const },
    })),
  );
  return { boardVersion: PROPOSED_MVP_BOARD.version, pieces };
}

function boardAndState(session: { boardVersion: string; rules: Prisma.JsonValue; pieces: Prisma.JsonValue }): { board: BoardDefinition; state: GameState } {
  const rules = rulesSchema.safeParse(session.rules);
  const pieces = piecesSchema.safeParse(session.pieces);
  if (!rules.success || !pieces.success || session.boardVersion !== PROPOSED_MVP_BOARD.version) {
    throw new AuthorizationError("STATE_CONFLICT", "A partida possui estado incompatível com esta versão do jogo.");
  }
  const board = createBoardDefinition({ ...PROPOSED_MVP_BOARD, rules: rules.data as LudoRules });
  const state: GameState = { boardVersion: session.boardVersion, pieces: pieces.data as PieceState[] };
  try { assertValidGameState(board, state); }
  catch { throw new AuthorizationError("STATE_CONFLICT", "A partida possui estado inválido."); }
  return { board, state };
}

function publicMove(move: LegalMove): PublicMove {
  return { pieceId: move.pieceId, from: move.from, to: move.to };
}

function publicChallenge(challenge: SelectedChallenge | null | undefined): PublicChallenge | null {
  if (!challenge || !challenge.questionVersion.answerType) return null;
  const media = challenge.questionVersion.media[0];
  return {
    id: challenge.id,
    difficulty: challenge.difficulty,
    dice: challenge.dice,
    isRepeated: challenge.isRepeated,
    prompt: {
      statement: challenge.questionVersion.statement,
      answerType: challenge.questionVersion.answerType,
      options: challenge.questionVersion.options.map(({ stableId, text, position }) => ({ id: stableId, text, position })),
      image: media ? { url: `/api/questoes/midia/${media.id}`, altText: media.altText } : null,
    },
  };
}

function gameDto(session: {
  id: string;
  status: GameDto["status"];
  phase: GameDto["phase"];
  turn: GameDto["turn"];
  revision: number;
  boardVersion: string;
  rules: Prisma.JsonValue;
  pieces: Prisma.JsonValue;
  errorCount: number;
  challenges: SelectedChallenge[];
}): GameDto {
  const { state } = boardAndState(session);
  return {
    id: session.id,
    status: session.status,
    phase: session.phase,
    turn: session.turn,
    revision: session.revision,
    boardVersion: session.boardVersion,
    pieces: state.pieces.map((piece) => ({ ...piece, position: { ...piece.position } })),
    errorCount: session.errorCount,
    challenge: publicChallenge(session.challenges[0]),
  };
}

const sessionSelect = {
  id: true,
  status: true,
  phase: true,
  turn: true,
  revision: true,
  boardVersion: true,
  rules: true,
  pieces: true,
  errorCount: true,
  challenges: { where: { status: "PENDING" as const }, orderBy: { presentedAt: "desc" as const }, take: 1, select: challengeSelect },
} satisfies Prisma.GameSessionSelect;

async function lockActivity(tx: Prisma.TransactionClient, activityId: string) {
  const rows = await tx.$queryRaw<Array<{ id: string; status: "DRAFT" | "OPEN" | "CLOSED" }>>`
    SELECT "id", "status" FROM "Activity" WHERE "id" = ${activityId}::uuid FOR UPDATE
  `;
  if (!rows[0]) throw new AuthorizationError("NOT_FOUND", "Atividade não encontrada.");
  return rows[0];
}

async function lockParticipation(tx: Prisma.TransactionClient, participationId: string): Promise<void> {
  const rows = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "ActivityParticipation" WHERE "id" = ${participationId}::uuid FOR UPDATE
  `;
  if (!rows[0]) throw new AuthorizationError("NOT_FOUND", "Participação não encontrada.");
}

async function lockGame(tx: Prisma.TransactionClient, gameId: string): Promise<void> {
  const rows = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "GameSession" WHERE "id" = ${gameId}::uuid FOR UPDATE
  `;
  if (!rows[0]) throw new AuthorizationError("NOT_FOUND", "Partida não encontrada.");
}

function enrollmentIsActive(participation: {
  studentId: string;
  activity: { schoolId: string; classId: string };
  enrollment: { studentId: string; schoolId: string; classId: string; status: "ACTIVE" | "ENDED"; startsAt: Date; endsAt: Date | null };
}, actorId: string, now = new Date()): boolean {
  const { enrollment, activity } = participation;
  return participation.studentId === actorId && enrollment.studentId === actorId &&
    enrollment.schoolId === activity.schoolId && enrollment.classId === activity.classId &&
    enrollment.status === "ACTIVE" && enrollment.startsAt <= now && (!enrollment.endsAt || enrollment.endsAt > now);
}

async function participationForStudent(client: Prisma.TransactionClient | typeof prisma, activityId: string, actorId: string) {
  return client.activityParticipation.findUnique({
    where: { activityId_studentId: { activityId, studentId: actorId } },
    select: {
      id: true,
      studentId: true,
      activity: { select: { id: true, status: true, schoolId: true, classId: true } },
      enrollment: { select: { studentId: true, schoolId: true, classId: true, status: true, startsAt: true, endsAt: true } },
      student: { select: { status: true, studentCode: true, globalRole: true } },
    },
  });
}

function assertPlayableParticipation(participation: Awaited<ReturnType<typeof participationForStudent>>, actorId: string): asserts participation is NonNullable<typeof participation> {
  if (!participation) throw new AuthorizationError("NOT_FOUND", "Participação não encontrada.");
  if (participation.student.status !== "ACTIVE" || !participation.student.studentCode || participation.student.globalRole) {
    throw new AuthorizationError("FORBIDDEN", "Conta de aluno indisponível.");
  }
  if (!enrollmentIsActive(participation, actorId)) throw new AuthorizationError("FORBIDDEN", "A matrícula desta participação não está vigente.");
}

export async function startOrResumeGame(input: { actor: AuthenticatedPrincipal; activityId: string }): Promise<GameDto> {
  assertStudent(input.actor); uuid(input.activityId, "Atividade inválida.");
  try {
    return await prisma.$transaction(async (tx) => {
      const activity = await lockActivity(tx, input.activityId);
      const participation = await participationForStudent(tx, input.activityId, input.actor.id);
      assertPlayableParticipation(participation, input.actor.id);
      await lockParticipation(tx, participation.id);
      if (activity.status !== "OPEN" || participation.activity.status !== "OPEN") {
        throw new AuthorizationError("STATE_CONFLICT", "A atividade não está aberta para jogar.");
      }

      const existing = await tx.gameSession.findFirst({
        where: { participationId: participation.id, status: "ACTIVE" },
        select: sessionSelect,
      });
      if (existing) return gameDto(existing);

      const state = initialState();
      const created = await tx.gameSession.create({
        data: {
          participationId: participation.id,
          boardVersion: PROPOSED_MVP_BOARD.version,
          rules: { ...PROPOSED_MVP_BOARD.rules },
          pieces: state.pieces as unknown as Prisma.InputJsonValue,
        },
        select: sessionSelect,
      });
      return gameDto(created);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10000, timeout: 15000 });
  } catch (error) { mapWrite(error); }
}

export async function getActiveGameForActivity(input: { actor: AuthenticatedPrincipal; activityId: string }): Promise<GameDto | null> {
  assertStudent(input.actor); uuid(input.activityId, "Atividade inválida.");
  const participation = await participationForStudent(prisma, input.activityId, input.actor.id);
  assertPlayableParticipation(participation, input.actor.id);
  const session = await prisma.gameSession.findFirst({ where: { participationId: participation.id, status: "ACTIVE" }, select: sessionSelect });
  return session ? gameDto(session) : null;
}

export async function getGameSession(input: { actor: AuthenticatedPrincipal; gameId: string }): Promise<GameDto> {
  assertStudent(input.actor); uuid(input.gameId, "Partida inválida.");
  const session = await prisma.gameSession.findFirst({
    where: { id: input.gameId, participation: { studentId: input.actor.id } },
    select: sessionSelect,
  });
  if (!session) throw new AuthorizationError("NOT_FOUND", "Partida não encontrada.");
  return gameDto(session);
}

async function chooseChallenge(
  tx: Prisma.TransactionClient,
  input: { activityId: string; gameId: string; difficulty: number; lastQuestionVersionId: string | null; randomInt: RandomInt },
) {
  const candidates = await tx.activityQuestionVersion.findMany({
    where: {
      activityId: input.activityId,
      questionVersion: { difficulty: input.difficulty, answerType: { not: null }, question: { status: "ACTIVE" } },
    },
    select: { questionVersion: { select: { id: true } } },
    orderBy: { questionVersionId: "asc" },
  });
  if (!candidates.length) return null;
  const used = new Set((await tx.gameChallenge.findMany({ where: { gameId: input.gameId }, select: { questionVersionId: true } })).map(({ questionVersionId }) => questionVersionId));
  const unseen = candidates.filter(({ questionVersion }) => !used.has(questionVersion.id));
  const repeated = unseen.length === 0;
  let pool = repeated ? candidates : unseen;
  if (pool.length > 1 && input.lastQuestionVersionId) pool = pool.filter(({ questionVersion }) => questionVersion.id !== input.lastQuestionVersionId);
  return { questionVersionId: pool[nextRandom(input.randomInt, pool.length)]!.questionVersion.id, isRepeated: repeated };
}

function runMachine(
  board: BoardDefinition,
  initial: GameState,
  randomInt: RandomInt,
): { state: GameState; rolls: Array<{ dice: number; pieceId: string | null }>; finished: boolean } {
  let state = initial;
  const rolls: Array<{ dice: number; pieceId: string | null }> = [];
  for (let index = 0; index < 24; index += 1) {
    const dice = rollDice(randomInt);
    const move = chooseMachineMove(board, state, dice);
    rolls.push({ dice, pieceId: move?.pieceId ?? null });
    if (move) {
      const transition = applyMove(board, state, move);
      state = transition.state;
      if (transition.winner) return { state, rolls, finished: true };
    }
    if (!(move && dice === 6 && board.rules.machineExtraRollOnSix)) return { state, rolls, finished: false };
  }
  throw new Error("[game] limite de jogadas consecutivas da máquina excedido.");
}

type BlockedRoll = { blocked: "FORBIDDEN" | "STATE_CONFLICT"; message: string };

export async function rollGame(input: {
  actor: AuthenticatedPrincipal;
  gameId: string;
  clientActionId: string;
  expectedRevision: number;
  randomInt?: RandomInt;
}): Promise<RollResult> {
  assertStudent(input.actor); uuid(input.gameId, "Partida inválida."); uuid(input.clientActionId, "Ação inválida."); validateRevision(input.expectedRevision);
  const randomInt = input.randomInt ?? secureRandomInt;
  try {
    const outcome = await prisma.$transaction(async (tx): Promise<RollResult | BlockedRoll> => {
      const located = await tx.gameSession.findFirst({
        where: { id: input.gameId, participation: { studentId: input.actor.id } },
        select: { participation: { select: { activityId: true } } },
      });
      if (!located) throw new AuthorizationError("NOT_FOUND", "Partida não encontrada.");
      const activity = await lockActivity(tx, located.participation.activityId);
      await lockGame(tx, input.gameId);
      const session = await tx.gameSession.findUniqueOrThrow({
        where: { id: input.gameId },
        select: {
          ...sessionSelect,
          lastQuestionVersionId: true,
          participation: {
            select: {
              studentId: true,
              activityId: true,
              activity: { select: { id: true, status: true, schoolId: true, classId: true } },
              enrollment: { select: { studentId: true, schoolId: true, classId: true, status: true, startsAt: true, endsAt: true } },
            },
          },
        },
      });
      const retry = await tx.gameAction.findUnique({ where: { gameId_clientActionId: { gameId: session.id, clientActionId: input.clientActionId } }, select: { result: true } });
      if (retry) return { ...(retry.result as unknown as RollResult), retried: true };

      if (!enrollmentIsActive(session.participation, input.actor.id)) {
        const now = new Date();
        await tx.gameChallenge.updateMany({ where: { gameId: session.id, status: "PENDING" }, data: { status: "CANCELLED", answeredAt: now } });
        await tx.gameSession.update({ where: { id: session.id }, data: { status: "SUSPENDED", suspendedAt: now, revision: { increment: 1 } } });
        return { blocked: "FORBIDDEN", message: "A matrícula desta participação não está vigente." };
      }
      if (activity.status !== "OPEN" || session.participation.activity.status !== "OPEN" || session.status !== "ACTIVE") {
        return { blocked: "STATE_CONFLICT", message: "A partida está suspensa porque a atividade não está aberta." };
      }
      if (session.revision !== input.expectedRevision) throw new AuthorizationError("STATE_CONFLICT", "A partida foi alterada em outra aba ou dispositivo.");
      if (session.turn !== "STUDENT" || (session.phase !== "WAITING_FIRST_EXIT" && session.phase !== "STUDENT_ROLL")) {
        throw new AuthorizationError("STATE_CONFLICT", "Não é possível lançar o dado nesta fase da partida.");
      }

      const { board, state: storedState } = boardAndState(session);
      const studentDice = rollDice(randomInt);
      let state = storedState;
      let phase: GameDto["phase"] = session.phase;
      let status: GameDto["status"] = session.status;
      let turn: GameDto["turn"] = "STUDENT";
      let candidateMoves: PublicMove[] = [];
      let noChallengeReason: RollResult["roll"]["noChallengeReason"] = null;
      let machineRolls: Array<{ dice: number; pieceId: string | null }> = [];
      let challenge: SelectedChallenge | null = null;
      let lastQuestionVersionId = session.lastQuestionVersionId;

      if (session.phase === "WAITING_FIRST_EXIT" && studentDice === 6) {
        const release = legalMoves(board, state, "STUDENT", 6)[0];
        if (!release) throw new AuthorizationError("STATE_CONFLICT", "Não foi possível liberar o primeiro pino.");
        state = applyMove(board, state, release).state;
        phase = "STUDENT_ROLL";
      } else if (session.phase === "STUDENT_ROLL") {
        const moves = legalMoves(board, state, "STUDENT", studentDice);
        candidateMoves = moves.map(publicMove);
        if (moves.length) {
          const selected = await chooseChallenge(tx, { activityId: session.participation.activityId, gameId: session.id, difficulty: studentDice, lastQuestionVersionId, randomInt });
          if (selected) {
            const nextRevision = session.revision + 1;
            challenge = await tx.gameChallenge.create({
              data: { gameId: session.id, questionVersionId: selected.questionVersionId, difficulty: studentDice, dice: studentDice, isRepeated: selected.isRepeated, sessionRevision: nextRevision },
              select: challengeSelect,
            });
            lastQuestionVersionId = selected.questionVersionId;
            phase = "CHALLENGE_PENDING";
          } else {
            noChallengeReason = "CONTENT_UNAVAILABLE";
          }
        } else {
          noChallengeReason = "NO_LEGAL_MOVE";
        }
      }

      if ((session.phase === "WAITING_FIRST_EXIT" && studentDice !== 6) || (session.phase === "STUDENT_ROLL" && phase !== "CHALLENGE_PENDING")) {
        turn = "MACHINE";
        const machine = runMachine(board, state, randomInt);
        state = machine.state;
        machineRolls = machine.rolls;
        if (machine.finished) {
          status = "FINISHED";
          phase = "FINISHED";
        } else {
          turn = "STUDENT";
          phase = session.phase === "WAITING_FIRST_EXIT" ? "WAITING_FIRST_EXIT" : "STUDENT_ROLL";
        }
      }

      const nextRevision = session.revision + 1;
      const updated = await tx.gameSession.update({
        where: { id: session.id },
        data: {
          status,
          phase,
          turn,
          pieces: state.pieces as unknown as Prisma.InputJsonValue,
          revision: nextRevision,
          lastQuestionVersionId,
          finishedAt: status === "FINISHED" ? new Date() : null,
        },
        select: { ...sessionSelect, challenges: undefined },
      });
      const result: RollResult = {
        game: gameDto({ ...updated, challenges: challenge ? [challenge] : [] }),
        roll: { studentDice, machineRolls, candidateMoves, noChallengeReason },
        retried: false,
      };
      await tx.gameAction.create({
        data: { gameId: session.id, clientActionId: input.clientActionId, type: "ROLL", expectedRevision: input.expectedRevision, result: result as unknown as Prisma.InputJsonValue },
      });
      return result;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10000, timeout: 15000 });
    if ("blocked" in outcome) throw new AuthorizationError(outcome.blocked, outcome.message);
    return outcome;
  } catch (error) { mapWrite(error); }
}
