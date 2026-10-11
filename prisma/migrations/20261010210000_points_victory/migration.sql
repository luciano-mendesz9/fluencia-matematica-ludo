CREATE TYPE "PointEventType" AS ENUM ('ANSWER_AWARD', 'VICTORY_BONUS');

CREATE TABLE "PointEvent" (
  "id" UUID NOT NULL,
  "participationId" UUID NOT NULL,
  "studentId" UUID NOT NULL,
  "classId" UUID NOT NULL,
  "activityId" UUID NOT NULL,
  "gameId" UUID NOT NULL,
  "answerAttemptId" UUID,
  "type" "PointEventType" NOT NULL,
  "amount" INTEGER NOT NULL,
  "awardedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PointEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PointEvent_amount_check" CHECK ("amount" > 0),
  CONSTRAINT "PointEvent_answer_context_check" CHECK (
    ("type" = 'ANSWER_AWARD' AND "answerAttemptId" IS NOT NULL)
    OR ("type" = 'VICTORY_BONUS' AND "answerAttemptId" IS NULL)
  )
);

CREATE UNIQUE INDEX "PointEvent_answerAttemptId_key" ON "PointEvent"("answerAttemptId");
CREATE UNIQUE INDEX "PointEvent_one_victory_bonus_per_game_key" ON "PointEvent"("gameId") WHERE "type" = 'VICTORY_BONUS';
CREATE INDEX "PointEvent_studentId_classId_awardedAt_idx" ON "PointEvent"("studentId", "classId", "awardedAt");
CREATE INDEX "PointEvent_participationId_awardedAt_idx" ON "PointEvent"("participationId", "awardedAt");
CREATE INDEX "PointEvent_gameId_awardedAt_idx" ON "PointEvent"("gameId", "awardedAt");

ALTER TABLE "PointEvent" ADD CONSTRAINT "PointEvent_participationId_fkey" FOREIGN KEY ("participationId") REFERENCES "ActivityParticipation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PointEvent" ADD CONSTRAINT "PointEvent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PointEvent" ADD CONSTRAINT "PointEvent_classId_fkey" FOREIGN KEY ("classId") REFERENCES "ClassGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PointEvent" ADD CONSTRAINT "PointEvent_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PointEvent" ADD CONSTRAINT "PointEvent_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "GameSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PointEvent" ADD CONSTRAINT "PointEvent_answerAttemptId_fkey" FOREIGN KEY ("answerAttemptId") REFERENCES "AnswerAttempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
