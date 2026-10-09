CREATE TYPE "QuestionAnswerType" AS ENUM ('MULTIPLE_CHOICE', 'NUMERIC');
CREATE TYPE "QuestionMediaKind" AS ENUM ('IMAGE');
CREATE TYPE "QuestionSubmissionStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'REJECTED', 'APPROVED_PUBLISHED');

ALTER TABLE "Question"
  ADD COLUMN "sourceQuestionId" UUID,
  ADD COLUMN "sourceVersionId" UUID;

ALTER TABLE "QuestionVersion"
  ADD COLUMN "answerType" "QuestionAnswerType",
  ADD COLUMN "explanation" TEXT,
  ADD COLUMN "numericExpected" DECIMAL(18,6);

ALTER TABLE "Question" ADD CONSTRAINT "Question_publication_source_check"
  CHECK (("sourceQuestionId" IS NULL AND "sourceVersionId" IS NULL) OR ("origin" = 'SEMED' AND "ownerId" IS NULL AND "sourceQuestionId" IS NOT NULL AND "sourceVersionId" IS NOT NULL));
ALTER TABLE "QuestionVersion" ADD CONSTRAINT "QuestionVersion_answer_policy_check"
  CHECK (("answerType" IS NULL AND "numericExpected" IS NULL) OR ("answerType" = 'MULTIPLE_CHOICE' AND "numericExpected" IS NULL) OR ("answerType" = 'NUMERIC' AND "numericExpected" IS NOT NULL));

CREATE TABLE "QuestionOption" (
  "id" UUID NOT NULL,
  "versionId" UUID NOT NULL,
  "stableId" UUID NOT NULL,
  "text" VARCHAR(500) NOT NULL,
  "position" INTEGER NOT NULL,
  "isCorrect" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "QuestionOption_position_check" CHECK ("position" >= 0),
  CONSTRAINT "QuestionOption_text_check" CHECK (char_length(btrim("text")) BETWEEN 1 AND 500)
);

CREATE TABLE "QuestionMedia" (
  "id" UUID NOT NULL,
  "versionId" UUID NOT NULL,
  "kind" "QuestionMediaKind" NOT NULL DEFAULT 'IMAGE',
  "mimeType" VARCHAR(80) NOT NULL,
  "byteSize" INTEGER NOT NULL,
  "altText" VARCHAR(300) NOT NULL,
  "contentHash" CHAR(64) NOT NULL,
  "bytes" BYTEA NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuestionMedia_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "QuestionMedia_size_check" CHECK ("byteSize" BETWEEN 1 AND 524288),
  CONSTRAINT "QuestionMedia_alt_check" CHECK (char_length(btrim("altText")) BETWEEN 3 AND 300),
  CONSTRAINT "QuestionMedia_mime_check" CHECK ("mimeType" IN ('image/png', 'image/jpeg', 'image/webp', 'image/gif'))
);

CREATE TABLE "QuestionSubmission" (
  "id" UUID NOT NULL,
  "sourceVersionId" UUID NOT NULL,
  "submitterId" UUID NOT NULL,
  "status" "QuestionSubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
  "revision" INTEGER NOT NULL DEFAULT 1,
  "reviewerId" UUID,
  "decisionNote" VARCHAR(1000),
  "publishedQuestionId" UUID,
  "publishedVersionId" UUID,
  "submittedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewStartedAt" TIMESTAMPTZ(3),
  "decidedAt" TIMESTAMPTZ(3),
  CONSTRAINT "QuestionSubmission_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "QuestionSubmission_decision_check" CHECK (
    ("status" IN ('SUBMITTED', 'UNDER_REVIEW') AND "decidedAt" IS NULL AND "publishedQuestionId" IS NULL AND "publishedVersionId" IS NULL)
    OR ("status" IN ('CHANGES_REQUESTED', 'REJECTED') AND "reviewerId" IS NOT NULL AND "decidedAt" IS NOT NULL AND "publishedQuestionId" IS NULL AND "publishedVersionId" IS NULL)
    OR ("status" = 'APPROVED_PUBLISHED' AND "reviewerId" IS NOT NULL AND "decidedAt" IS NOT NULL AND "publishedQuestionId" IS NOT NULL AND "publishedVersionId" IS NOT NULL)
  )
);

CREATE INDEX "Question_sourceQuestionId_sourceVersionId_idx" ON "Question"("sourceQuestionId", "sourceVersionId");
CREATE UNIQUE INDEX "QuestionOption_versionId_stableId_key" ON "QuestionOption"("versionId", "stableId");
CREATE UNIQUE INDEX "QuestionOption_versionId_position_key" ON "QuestionOption"("versionId", "position");
CREATE UNIQUE INDEX "QuestionOption_one_correct_per_version" ON "QuestionOption"("versionId") WHERE "isCorrect" = true;
CREATE INDEX "QuestionOption_versionId_isCorrect_idx" ON "QuestionOption"("versionId", "isCorrect");
CREATE UNIQUE INDEX "QuestionMedia_versionId_kind_key" ON "QuestionMedia"("versionId", "kind");
CREATE INDEX "QuestionMedia_contentHash_idx" ON "QuestionMedia"("contentHash");
CREATE UNIQUE INDEX "QuestionSubmission_sourceVersionId_key" ON "QuestionSubmission"("sourceVersionId");
CREATE UNIQUE INDEX "QuestionSubmission_publishedQuestionId_key" ON "QuestionSubmission"("publishedQuestionId");
CREATE UNIQUE INDEX "QuestionSubmission_publishedVersionId_key" ON "QuestionSubmission"("publishedVersionId");
CREATE INDEX "QuestionSubmission_status_submittedAt_idx" ON "QuestionSubmission"("status", "submittedAt");
CREATE INDEX "QuestionSubmission_submitterId_submittedAt_idx" ON "QuestionSubmission"("submitterId", "submittedAt");
CREATE INDEX "QuestionSubmission_reviewerId_decidedAt_idx" ON "QuestionSubmission"("reviewerId", "decidedAt");

ALTER TABLE "Question" ADD CONSTRAINT "Question_sourceQuestionId_fkey" FOREIGN KEY ("sourceQuestionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Question" ADD CONSTRAINT "Question_sourceVersionId_fkey" FOREIGN KEY ("sourceVersionId") REFERENCES "QuestionVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "QuestionVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QuestionMedia" ADD CONSTRAINT "QuestionMedia_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "QuestionVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QuestionSubmission" ADD CONSTRAINT "QuestionSubmission_sourceVersionId_fkey" FOREIGN KEY ("sourceVersionId") REFERENCES "QuestionVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QuestionSubmission" ADD CONSTRAINT "QuestionSubmission_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QuestionSubmission" ADD CONSTRAINT "QuestionSubmission_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QuestionSubmission" ADD CONSTRAINT "QuestionSubmission_publishedQuestionId_fkey" FOREIGN KEY ("publishedQuestionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QuestionSubmission" ADD CONSTRAINT "QuestionSubmission_publishedVersionId_fkey" FOREIGN KEY ("publishedVersionId") REFERENCES "QuestionVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
