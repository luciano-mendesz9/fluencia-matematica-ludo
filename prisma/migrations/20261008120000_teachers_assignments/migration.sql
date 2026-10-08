-- Existing users gain optimistic concurrency without changing authentication identity.
ALTER TABLE "User" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 1;

CREATE TYPE "TeacherAssignmentStatus" AS ENUM ('ACTIVE', 'ENDED');

-- Composite targets let PostgreSQL enforce that assignments use one teacher membership and class
-- from the same school, even when writes bypass the application service.
CREATE UNIQUE INDEX IF NOT EXISTS "ClassGroup_id_schoolId_key" ON "ClassGroup"("id", "schoolId");
CREATE UNIQUE INDEX "SchoolMembership_id_userId_schoolId_key" ON "SchoolMembership"("id", "userId", "schoolId");

CREATE TABLE "TeacherClassAssignment" (
    "id" UUID NOT NULL,
    "membershipId" UUID NOT NULL,
    "teacherId" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "classId" UUID NOT NULL,
    "status" "TeacherAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "startsAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMPTZ(3),
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "TeacherClassAssignment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TeacherClassAssignment_period_status_check" CHECK (
      ("status" = 'ACTIVE' AND ("endsAt" IS NULL OR "endsAt" > "startsAt"))
      OR
      ("status" = 'ENDED' AND "endsAt" IS NOT NULL AND "endsAt" > "startsAt")
    )
);

CREATE UNIQUE INDEX "TeacherClassAssignment_one_active_teacher_class"
ON "TeacherClassAssignment"("teacherId", "classId")
WHERE "status" = 'ACTIVE';

CREATE INDEX "TeacherClassAssignment_teacherId_schoolId_status_startsAt_endsAt_idx"
ON "TeacherClassAssignment"("teacherId", "schoolId", "status", "startsAt", "endsAt");
CREATE INDEX "TeacherClassAssignment_schoolId_classId_status_idx"
ON "TeacherClassAssignment"("schoolId", "classId", "status");
CREATE INDEX "TeacherClassAssignment_membershipId_status_idx"
ON "TeacherClassAssignment"("membershipId", "status");

ALTER TABLE "TeacherClassAssignment" ADD CONSTRAINT "TeacherClassAssignment_membershipId_teacherId_schoolId_fkey"
FOREIGN KEY ("membershipId", "teacherId", "schoolId") REFERENCES "SchoolMembership"("id", "userId", "schoolId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TeacherClassAssignment" ADD CONSTRAINT "TeacherClassAssignment_teacherId_fkey"
FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TeacherClassAssignment" ADD CONSTRAINT "TeacherClassAssignment_schoolId_fkey"
FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TeacherClassAssignment" ADD CONSTRAINT "TeacherClassAssignment_classId_schoolId_fkey"
FOREIGN KEY ("classId", "schoolId") REFERENCES "ClassGroup"("id", "schoolId") ON DELETE RESTRICT ON UPDATE CASCADE;
