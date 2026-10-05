-- AlterTable
ALTER TABLE "Session" ADD COLUMN "requestId" UUID;

-- Preserve compatibility with any pre-existing sessions before enforcing the invariant.
UPDATE "Session" SET "requestId" = "id" WHERE "requestId" IS NULL;

ALTER TABLE "Session" ALTER COLUMN "requestId" SET NOT NULL;

-- CreateTable
CREATE TABLE "LoginThrottle" (
    "id" UUID NOT NULL,
    "keyHash" CHAR(64) NOT NULL,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "blockedUntil" TIMESTAMPTZ(3),
    "firstFailedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "LoginThrottle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_requestId_key" ON "Session"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "LoginThrottle_keyHash_key" ON "LoginThrottle"("keyHash");

-- CreateIndex
CREATE INDEX "LoginThrottle_blockedUntil_idx" ON "LoginThrottle"("blockedUntil");
