-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'ENDED');

-- The composite target lets PostgreSQL enforce that enrollment and class belong to the same school.
CREATE UNIQUE INDEX "ClassGroup_id_schoolId_key" ON "ClassGroup"("id", "schoolId");

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "classId" UUID NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "startsAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMPTZ(3),
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Enrollment_period_status_check" CHECK (
      ("status" = 'ACTIVE' AND "endsAt" IS NULL)
      OR
      ("status" = 'ENDED' AND "endsAt" IS NOT NULL AND "endsAt" > "startsAt")
    )
);

-- One principal active enrollment per student across the platform.
CREATE UNIQUE INDEX "Enrollment_one_active_per_student"
ON "Enrollment"("studentId")
WHERE "status" = 'ACTIVE';

-- CreateIndex
CREATE INDEX "Enrollment_studentId_status_startsAt_endsAt_idx" ON "Enrollment"("studentId", "status", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "Enrollment_schoolId_status_classId_startsAt_idx" ON "Enrollment"("schoolId", "status", "classId", "startsAt");

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_classId_schoolId_fkey" FOREIGN KEY ("classId", "schoolId") REFERENCES "ClassGroup"("id", "schoolId") ON DELETE RESTRICT ON UPDATE CASCADE;
