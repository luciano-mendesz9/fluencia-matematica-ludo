CREATE TYPE "GameSessionStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'FINISHED');
CREATE TYPE "GamePhase" AS ENUM ('WAITING_FIRST_EXIT', 'STUDENT_ROLL', 'CHALLENGE_PENDING', 'MOVE_PENDING', 'RECOVERY_ROLL', 'RECOVERY_RELEASE', 'FINISHED');
CREATE TYPE "GameTurn" AS ENUM ('STUDENT', 'MACHINE');
CREATE TYPE "GameActionType" AS ENUM ('ROLL');
CREATE TYPE "ChallengeStatus" AS ENUM ('PENDING', 'ANSWERED', 'CANCELLED');

CREATE TABLE "GameSession" (
  "id" UUID NOT NULL,
  "participationId" UUID NOT NULL,
  "status" "GameSessionStatus" NOT NULL DEFAULT 'ACTIVE',
  "phase" "GamePhase" NOT NULL DEFAULT 'WAITING_FIRST_EXIT',
  "turn" "GameTurn" NOT NULL DEFAULT 'STUDENT',
  "boardVersion" VARCHAR(80) NOT NULL,
  "rules" JSONB NOT NULL,
  "pieces" JSONB NOT NULL,
  "revision" INTEGER NOT NULL DEFAULT 1,
  "errorCount" INTEGER NOT NULL DEFAULT 0,
  "lastQuestionVersionId" UUID,
  "startedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "suspendedAt" TIMESTAMPTZ(3),
  "finishedAt" TIMESTAMPTZ(3),
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GameSession_revision_check" CHECK ("revision" > 0),
  CONSTRAINT "GameSession_error_count_check" CHECK ("errorCount" >= 0),
  CONSTRAINT "GameSession_lifecycle_check" CHECK (
    ("status" = 'ACTIVE' AND "suspendedAt" IS NULL AND "finishedAt" IS NULL)
    OR ("status" = 'SUSPENDED' AND "suspendedAt" IS NOT NULL AND "finishedAt" IS NULL)
    OR ("status" = 'FINISHED' AND "finishedAt" IS NOT NULL)
  )
);

CREATE TABLE "GameAction" (
  "id" UUID NOT NULL,
  "gameId" UUID NOT NULL,
  "clientActionId" UUID NOT NULL,
  "type" "GameActionType" NOT NULL,
  "expectedRevision" INTEGER NOT NULL,
  "result" JSONB NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GameAction_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GameAction_revision_check" CHECK ("expectedRevision" > 0)
);

CREATE TABLE "GameChallenge" (
  "id" UUID NOT NULL,
  "gameId" UUID NOT NULL,
  "questionVersionId" UUID NOT NULL,
  "difficulty" INTEGER NOT NULL,
  "dice" INTEGER NOT NULL,
  "status" "ChallengeStatus" NOT NULL DEFAULT 'PENDING',
  "isRepeated" BOOLEAN NOT NULL DEFAULT false,
  "sessionRevision" INTEGER NOT NULL,
  "presentedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "answeredAt" TIMESTAMPTZ(3),
  CONSTRAINT "GameChallenge_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GameChallenge_difficulty_check" CHECK ("difficulty" BETWEEN 1 AND 6),
  CONSTRAINT "GameChallenge_dice_check" CHECK ("dice" BETWEEN 1 AND 6),
  CONSTRAINT "GameChallenge_revision_check" CHECK ("sessionRevision" > 0),
  CONSTRAINT "GameChallenge_lifecycle_check" CHECK (
    ("status" = 'PENDING' AND "answeredAt" IS NULL)
    OR ("status" <> 'PENDING' AND "answeredAt" IS NOT NULL)
  )
);

CREATE UNIQUE INDEX "GameSession_one_active_per_participation_key"
  ON "GameSession"("participationId") WHERE "status" = 'ACTIVE';
CREATE INDEX "GameSession_participationId_status_startedAt_idx" ON "GameSession"("participationId", "status", "startedAt");
CREATE INDEX "GameSession_status_updatedAt_idx" ON "GameSession"("status", "updatedAt");
CREATE UNIQUE INDEX "GameAction_gameId_clientActionId_key" ON "GameAction"("gameId", "clientActionId");
CREATE INDEX "GameAction_gameId_createdAt_idx" ON "GameAction"("gameId", "createdAt");
CREATE UNIQUE INDEX "GameChallenge_one_pending_per_game_key"
  ON "GameChallenge"("gameId") WHERE "status" = 'PENDING';
CREATE INDEX "GameChallenge_gameId_presentedAt_idx" ON "GameChallenge"("gameId", "presentedAt");
CREATE INDEX "GameChallenge_questionVersionId_idx" ON "GameChallenge"("questionVersionId");

ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_participationId_fkey"
  FOREIGN KEY ("participationId") REFERENCES "ActivityParticipation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GameAction" ADD CONSTRAINT "GameAction_gameId_fkey"
  FOREIGN KEY ("gameId") REFERENCES "GameSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GameChallenge" ADD CONSTRAINT "GameChallenge_gameId_fkey"
  FOREIGN KEY ("gameId") REFERENCES "GameSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GameChallenge" ADD CONSTRAINT "GameChallenge_questionVersionId_fkey"
  FOREIGN KEY ("questionVersionId") REFERENCES "QuestionVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
