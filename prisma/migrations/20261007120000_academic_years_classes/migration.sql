-- CreateEnum
CREATE TYPE "AcademicYearStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ClassGroupStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "AcademicYearStatus" NOT NULL DEFAULT 'ACTIVE',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AcademicYear_year_check" CHECK ("year" BETWEEN 2000 AND 2100)
);

-- CreateTable
CREATE TABLE "ClassGroup" (
    "id" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "academicYearId" UUID NOT NULL,
    "grade" INTEGER NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "normalizedName" VARCHAR(120) NOT NULL,
    "status" "ClassGroupStatus" NOT NULL DEFAULT 'ACTIVE',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ClassGroup_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ClassGroup_grade_check" CHECK ("grade" BETWEEN 1 AND 5)
);

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_schoolId_year_key" ON "AcademicYear"("schoolId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_id_schoolId_key" ON "AcademicYear"("id", "schoolId");

-- CreateIndex
CREATE INDEX "AcademicYear_schoolId_status_year_idx" ON "AcademicYear"("schoolId", "status", "year");

-- CreateIndex
CREATE UNIQUE INDEX "ClassGroup_schoolId_academicYearId_normalizedName_key" ON "ClassGroup"("schoolId", "academicYearId", "normalizedName");

-- CreateIndex
CREATE INDEX "ClassGroup_schoolId_status_academicYearId_grade_name_idx" ON "ClassGroup"("schoolId", "status", "academicYearId", "grade", "name");

-- AddForeignKey
ALTER TABLE "AcademicYear" ADD CONSTRAINT "AcademicYear_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassGroup" ADD CONSTRAINT "ClassGroup_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- The composite key prevents a class from referencing an academic year in another school.
ALTER TABLE "ClassGroup" ADD CONSTRAINT "ClassGroup_academicYearId_schoolId_fkey" FOREIGN KEY ("academicYearId", "schoolId") REFERENCES "AcademicYear"("id", "schoolId") ON DELETE RESTRICT ON UPDATE CASCADE;
