CREATE TYPE "ActivityStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED');
CREATE TYPE "AcceptedAnswerOutcome" AS ENUM ('CORRECT', 'INCORRECT');

CREATE TABLE "Activity" (
  "id" UUID NOT NULL,
  "schoolId" UUID NOT NULL,
  "classId" UUID NOT NULL,
  "teacherId" UUID NOT NULL,
  "title" VARCHAR(160) NOT NULL,
  "instructions" VARCHAR(1000),
  "targetCount" INTEGER NOT NULL,
  "status" "ActivityStatus" NOT NULL DEFAULT 'DRAFT',
  "revision" INTEGER NOT NULL DEFAULT 1,
  "openedAt" TIMESTAMPTZ(3),
  "closedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "Activity_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Activity_target_check" CHECK ("targetCount" BETWEEN 1 AND 1000),
  CONSTRAINT "Activity_title_check" CHECK (char_length(btrim("title")) BETWEEN 3 AND 160),
  CONSTRAINT "Activity_lifecycle_check" CHECK (
    ("status" = 'DRAFT' AND "openedAt" IS NULL AND "closedAt" IS NULL)
    OR ("status" = 'OPEN' AND "openedAt" IS NOT NULL AND "closedAt" IS NULL)
    OR ("status" = 'CLOSED' AND "openedAt" IS NOT NULL AND "closedAt" IS NOT NULL)
  )
);

CREATE TABLE "ActivityQuestionVersion" (
  "activityId" UUID NOT NULL,
  "questionVersionId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActivityQuestionVersion_pkey" PRIMARY KEY ("activityId", "questionVersionId")
);

CREATE TABLE "ActivityParticipation" (
  "id" UUID NOT NULL,
  "activityId" UUID NOT NULL,
  "enrollmentId" UUID NOT NULL,
  "studentId" UUID NOT NULL,
  "acceptedAnswers" INTEGER NOT NULL DEFAULT 0,
  "correctAnswers" INTEGER NOT NULL DEFAULT 0,
  "incorrectAnswers" INTEGER NOT NULL DEFAULT 0,
  "extraAnswers" INTEGER NOT NULL DEFAULT 0,
  "targetReachedAt" TIMESTAMPTZ(3),
  "revision" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "ActivityParticipation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ActivityParticipation_counts_check" CHECK (
    "acceptedAnswers" >= 0 AND "correctAnswers" >= 0 AND "incorrectAnswers" >= 0
    AND "extraAnswers" >= 0 AND "acceptedAnswers" = "correctAnswers" + "incorrectAnswers"
    AND "extraAnswers" <= "acceptedAnswers"
  )
);

CREATE TABLE "ActivityAnswerReceipt" (
  "id" UUID NOT NULL,
  "participationId" UUID NOT NULL,
  "clientActionId" UUID NOT NULL,
  "outcome" "AcceptedAnswerOutcome" NOT NULL,
  "acceptedNumber" INTEGER NOT NULL,
  "isExtra" BOOLEAN NOT NULL,
  "acceptedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActivityAnswerReceipt_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ActivityAnswerReceipt_number_check" CHECK ("acceptedNumber" > 0)
);

CREATE INDEX "Activity_teacherId_schoolId_status_createdAt_idx" ON "Activity"("teacherId", "schoolId", "status", "createdAt");
CREATE INDEX "Activity_classId_status_openedAt_idx" ON "Activity"("classId", "status", "openedAt");
CREATE INDEX "ActivityQuestionVersion_questionVersionId_idx" ON "ActivityQuestionVersion"("questionVersionId");
CREATE UNIQUE INDEX "ActivityParticipation_activityId_studentId_key" ON "ActivityParticipation"("activityId", "studentId");
CREATE INDEX "ActivityParticipation_studentId_createdAt_idx" ON "ActivityParticipation"("studentId", "createdAt");
CREATE INDEX "ActivityParticipation_enrollmentId_idx" ON "ActivityParticipation"("enrollmentId");
CREATE UNIQUE INDEX "ActivityAnswerReceipt_participationId_clientActionId_key" ON "ActivityAnswerReceipt"("participationId", "clientActionId");
CREATE INDEX "ActivityAnswerReceipt_participationId_acceptedAt_idx" ON "ActivityAnswerReceipt"("participationId", "acceptedAt");

ALTER TABLE "Activity" ADD CONSTRAINT "Activity_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_classId_schoolId_fkey" FOREIGN KEY ("classId", "schoolId") REFERENCES "ClassGroup"("id", "schoolId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ActivityQuestionVersion" ADD CONSTRAINT "ActivityQuestionVersion_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActivityQuestionVersion" ADD CONSTRAINT "ActivityQuestionVersion_questionVersionId_fkey" FOREIGN KEY ("questionVersionId") REFERENCES "QuestionVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ActivityParticipation" ADD CONSTRAINT "ActivityParticipation_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ActivityParticipation" ADD CONSTRAINT "ActivityParticipation_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ActivityParticipation" ADD CONSTRAINT "ActivityParticipation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ActivityAnswerReceipt" ADD CONSTRAINT "ActivityAnswerReceipt_participationId_fkey" FOREIGN KEY ("participationId") REFERENCES "ActivityParticipation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
