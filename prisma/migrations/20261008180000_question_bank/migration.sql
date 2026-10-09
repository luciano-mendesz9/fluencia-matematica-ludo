CREATE TYPE "CatalogStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "QuestionOrigin" AS ENUM ('SEMED', 'PRIVATE');
CREATE TYPE "QuestionStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

CREATE TABLE "Theme" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "normalizedName" VARCHAR(120) NOT NULL,
    "status" "CatalogStatus" NOT NULL DEFAULT 'ACTIVE',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Skill" (
    "id" UUID NOT NULL,
    "themeId" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "normalizedName" VARCHAR(160) NOT NULL,
    "status" "CatalogStatus" NOT NULL DEFAULT 'ACTIVE',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Question" (
    "id" UUID NOT NULL,
    "origin" "QuestionOrigin" NOT NULL,
    "ownerId" UUID,
    "createdById" UUID NOT NULL,
    "status" "QuestionStatus" NOT NULL DEFAULT 'ACTIVE',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "latestVersionNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "Question_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Question_origin_owner_check" CHECK (("origin" = 'SEMED' AND "ownerId" IS NULL) OR ("origin" = 'PRIVATE' AND "ownerId" IS NOT NULL))
);

CREATE TABLE "QuestionVersion" (
    "id" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "grade" INTEGER NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "themeId" UUID NOT NULL,
    "skillId" UUID,
    "statement" TEXT NOT NULL,
    "contentHash" CHAR(64) NOT NULL,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuestionVersion_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "QuestionVersion_grade_check" CHECK ("grade" BETWEEN 1 AND 5),
    CONSTRAINT "QuestionVersion_difficulty_check" CHECK ("difficulty" BETWEEN 1 AND 6),
    CONSTRAINT "QuestionVersion_version_check" CHECK ("versionNumber" >= 1),
    CONSTRAINT "QuestionVersion_statement_check" CHECK (char_length(btrim("statement")) BETWEEN 5 AND 2000)
);

CREATE UNIQUE INDEX "Theme_normalizedName_key" ON "Theme"("normalizedName");
CREATE INDEX "Theme_status_name_idx" ON "Theme"("status", "name");
CREATE UNIQUE INDEX "Skill_themeId_normalizedName_key" ON "Skill"("themeId", "normalizedName");
CREATE UNIQUE INDEX "Skill_id_themeId_key" ON "Skill"("id", "themeId");
CREATE INDEX "Skill_themeId_status_name_idx" ON "Skill"("themeId", "status", "name");
CREATE INDEX "Question_origin_status_idx" ON "Question"("origin", "status");
CREATE INDEX "Question_ownerId_status_idx" ON "Question"("ownerId", "status");
CREATE UNIQUE INDEX "QuestionVersion_questionId_versionNumber_key" ON "QuestionVersion"("questionId", "versionNumber");
CREATE INDEX "QuestionVersion_grade_difficulty_idx" ON "QuestionVersion"("grade", "difficulty");
CREATE INDEX "QuestionVersion_themeId_skillId_idx" ON "QuestionVersion"("themeId", "skillId");
CREATE INDEX "QuestionVersion_contentHash_idx" ON "QuestionVersion"("contentHash");

ALTER TABLE "Skill" ADD CONSTRAINT "Skill_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Question" ADD CONSTRAINT "Question_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Question" ADD CONSTRAINT "Question_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QuestionVersion" ADD CONSTRAINT "QuestionVersion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QuestionVersion" ADD CONSTRAINT "QuestionVersion_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QuestionVersion" ADD CONSTRAINT "QuestionVersion_skillId_themeId_fkey" FOREIGN KEY ("skillId", "themeId") REFERENCES "Skill"("id", "themeId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QuestionVersion" ADD CONSTRAINT "QuestionVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
