-- Active memberships are unique even when they have a scheduled end date.
DROP INDEX "SchoolMembership_one_active_per_school_user";

CREATE UNIQUE INDEX "SchoolMembership_one_active_per_school_user"
ON "SchoolMembership"("userId", "schoolId")
WHERE "status" = 'ACTIVE';
