ALTER TYPE "GameActionType" ADD VALUE 'ANSWER';
ALTER TYPE "GameActionType" ADD VALUE 'MOVE';

CREATE TYPE "AnswerAttemptOutcome" AS ENUM ('CORRECT', 'INCORRECT');

ALTER TABLE "ActivityParticipation" ADD COLUMN "pointsBalance" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "GameSession" ADD COLUMN "pointsEarned" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "AnswerAttempt" (
  "id" UUID NOT NULL,
  "challengeId" UUID NOT NULL,
  "gameId" UUID NOT NULL,
  "participationId" UUID NOT NULL,
  "clientActionId" UUID NOT NULL,
  "response" JSONB NOT NULL,
  "outcome" "AnswerAttemptOutcome" NOT NULL,
  "errorStreakBefore" INTEGER NOT NULL,
  "acceptedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnswerAttempt_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AnswerAttempt_error_streak_check" CHECK ("errorStreakBefore" >= 0)
);

CREATE UNIQUE INDEX "AnswerAttempt_challengeId_key" ON "AnswerAttempt"("challengeId");
CREATE UNIQUE INDEX "AnswerAttempt_gameId_clientActionId_key" ON "AnswerAttempt"("gameId", "clientActionId");
CREATE INDEX "AnswerAttempt_participationId_acceptedAt_idx" ON "AnswerAttempt"("participationId", "acceptedAt");
CREATE INDEX "AnswerAttempt_gameId_acceptedAt_idx" ON "AnswerAttempt"("gameId", "acceptedAt");

ALTER TABLE "AnswerAttempt" ADD CONSTRAINT "AnswerAttempt_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "GameChallenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AnswerAttempt" ADD CONSTRAINT "AnswerAttempt_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "GameSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AnswerAttempt" ADD CONSTRAINT "AnswerAttempt_participationId_fkey" FOREIGN KEY ("participationId") REFERENCES "ActivityParticipation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
