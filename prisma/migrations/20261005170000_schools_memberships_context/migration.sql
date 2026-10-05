-- CreateEnum
CREATE TYPE "SchoolStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "SchoolMembershipRole" AS ENUM ('COORDINATOR', 'TEACHER');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ENDED');

-- CreateTable
CREATE TABLE "School" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "externalCode" VARCHAR(80),
    "status" "SchoolStatus" NOT NULL DEFAULT 'ACTIVE',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolMembership" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "role" "SchoolMembershipRole" NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "startsAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMPTZ(3),
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SchoolMembership_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SchoolMembership_period_check" CHECK ("endsAt" IS NULL OR "endsAt" > "startsAt")
);

-- CreateIndex
CREATE UNIQUE INDEX "School_externalCode_key" ON "School"("externalCode");

-- CreateIndex
CREATE INDEX "School_status_name_idx" ON "School"("status", "name");

-- CreateIndex
CREATE INDEX "SchoolMembership_userId_status_startsAt_endsAt_idx" ON "SchoolMembership"("userId", "status", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "SchoolMembership_schoolId_role_status_idx" ON "SchoolMembership"("schoolId", "role", "status");

-- Only one current membership may authorize a user in a school.
CREATE UNIQUE INDEX "SchoolMembership_one_active_per_school_user"
ON "SchoolMembership"("userId", "schoolId")
WHERE "status" = 'ACTIVE' AND "endsAt" IS NULL;

-- AddForeignKey
ALTER TABLE "SchoolMembership" ADD CONSTRAINT "SchoolMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolMembership" ADD CONSTRAINT "SchoolMembership_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
