import "dotenv/config";
import { createNeonTestPool } from "../helpers/neon-pool";
import { throttleKey } from "../../src/server/auth/crypto";
import { authFixtures } from "./auth-fixtures";

export default async function globalTeardown() {
  const { pool } = createNeonTestPool();
  try {
    const schoolEmails = [
      authFixtures.schools.teacherOne.email,
      authFixtures.schools.teacherTwo.email,
      authFixtures.schools.coordinator.email,
      authFixtures.schools.linkCandidate.email,
      authFixtures.schools.noMembership.email,
      authFixtures.schools.multiTeacher.email,
    ];
    const taskEmails = [authFixtures.people.newTeacher.email, authFixtures.people.globalDeveloper.email];
    const cleanupEmails = [...schoolEmails, ...taskEmails];
    const schoolCodes = [
      authFixtures.schools.schoolA.code,
      authFixtures.schools.schoolB.code,
      authFixtures.schools.schoolC.code,
      authFixtures.schools.created.code,
    ];
    const schoolUsers = await pool.query('SELECT "id" FROM "User" WHERE "normalizedEmail" = ANY($1::text[]) OR "name" = $2', [cleanupEmails, authFixtures.students.name]);
    const schools = await pool.query('SELECT "id" FROM "School" WHERE "externalCode" = ANY($1::text[])', [schoolCodes]);
    const schoolUserIds = schoolUsers.rows.map((row) => row.id);
    const schoolIds = schools.rows.map((row) => row.id);
    const memberships = await pool.query('SELECT "id" FROM "SchoolMembership" WHERE "userId" = ANY($1::uuid[]) OR "schoolId" = ANY($2::uuid[])', [schoolUserIds, schoolIds]);
    const membershipIds = memberships.rows.map((row) => row.id);
    await pool.query('DELETE FROM "QuestionVersion" WHERE "questionId" IN (SELECT "id" FROM "Question" WHERE "createdById" = ANY($1::uuid[]) OR "ownerId" = ANY($1::uuid[]))', [schoolUserIds]);
    await pool.query('DELETE FROM "Question" WHERE "createdById" = ANY($1::uuid[]) OR "ownerId" = ANY($1::uuid[])', [schoolUserIds]);
    await pool.query(
      'DELETE FROM "AuditEvent" WHERE "actorId" = ANY($1::uuid[]) OR "targetId" = ANY($2::text[]) OR "schoolId" = ANY($3::uuid[])',
      [schoolUserIds, [...schoolUserIds, ...schoolIds, ...membershipIds], schoolIds],
    );
    await pool.query('DELETE FROM "Session" WHERE "userId" = ANY($1::uuid[])', [schoolUserIds]);
    await pool.query('DELETE FROM "PasswordReset" WHERE "userId" = ANY($1::uuid[])', [schoolUserIds]);
    await pool.query('DELETE FROM "Enrollment" WHERE "studentId" = ANY($1::uuid[]) OR "schoolId" = ANY($2::uuid[])', [schoolUserIds, schoolIds]);
    await pool.query('DELETE FROM "TeacherClassAssignment" WHERE "teacherId" = ANY($1::uuid[]) OR "schoolId" = ANY($2::uuid[])', [schoolUserIds, schoolIds]);
    await pool.query('DELETE FROM "ClassGroup" WHERE "schoolId" = ANY($1::uuid[])', [schoolIds]);
    await pool.query('DELETE FROM "AcademicYear" WHERE "schoolId" = ANY($1::uuid[])', [schoolIds]);
    await pool.query('DELETE FROM "SchoolMembership" WHERE "userId" = ANY($1::uuid[]) OR "schoolId" = ANY($2::uuid[])', [schoolUserIds, schoolIds]);
    await pool.query('DELETE FROM "School" WHERE "id" = ANY($1::uuid[])', [schoolIds]);
    await pool.query('DELETE FROM "User" WHERE "id" = ANY($1::uuid[])', [schoolUserIds]);

    const fixtureUsers = await pool.query(`
      SELECT "id" FROM "User"
      WHERE "normalizedEmail" = ANY($1::text[]) OR "studentCode" = ANY($2::text[])
    `, [[
      authFixtures.adult.identifier,
      authFixtures.blocked.identifier,
      authFixtures.recovery.adminEmail,
      authFixtures.recovery.requestEmail,
      authFixtures.recovery.resetEmail,
      ...cleanupEmails,
    ], [authFixtures.student.identifier, authFixtures.recovery.studentCode]]);
    const fixtureUserIds = fixtureUsers.rows.map((row) => row.id);
    await pool.query('DELETE FROM "QuestionVersion" WHERE "questionId" IN (SELECT "id" FROM "Question" WHERE "createdById" = ANY($1::uuid[]) OR "ownerId" = ANY($1::uuid[]))', [fixtureUserIds]);
    await pool.query('DELETE FROM "Question" WHERE "createdById" = ANY($1::uuid[]) OR "ownerId" = ANY($1::uuid[])', [fixtureUserIds]);
    await pool.query('DELETE FROM "Skill" WHERE "themeId" IN (SELECT "id" FROM "Theme" WHERE "normalizedName" = $1)', ['algebra fm-010 e2e']);
    await pool.query('DELETE FROM "Theme" WHERE "normalizedName" = $1', ['algebra fm-010 e2e']);
    await pool.query(
      'DELETE FROM "AuditEvent" WHERE "actorId" = ANY($1::uuid[]) OR "targetId" = ANY($2::text[])',
      [fixtureUserIds, fixtureUserIds],
    );
    await pool.query(
      "DELETE FROM \"User\" WHERE \"normalizedEmail\" = ANY($1::text[]) OR \"studentCode\" = ANY($2::text[])",
      [[
        authFixtures.adult.identifier,
        authFixtures.blocked.identifier,
        authFixtures.recovery.adminEmail,
        authFixtures.recovery.requestEmail,
        authFixtures.recovery.resetEmail,
        ...taskEmails,
      ], [authFixtures.student.identifier, authFixtures.recovery.studentCode]],
    );
    await pool.query("DELETE FROM \"LoginThrottle\" WHERE \"keyHash\" = ANY($1::text[])", [[
      throttleKey("identifier", `adult:${authFixtures.adult.identifier}`),
      throttleKey("identifier", `student:${authFixtures.student.identifier}`),
      throttleKey("identifier", `adult:${authFixtures.blocked.identifier}`),
      throttleKey("identifier", `adult:${authFixtures.invalidIdentifier}`),
      throttleKey("identifier", `adult:${authFixtures.rateIdentifier}`),
      throttleKey("ip", "203.0.113.50"),
      throttleKey("ip", "unknown"),
      throttleKey("ip", "127.0.0.1"),
      throttleKey("ip", "::1"),
      throttleKey("reset-identifier", authFixtures.recovery.requestEmail),
      throttleKey("reset-identifier", "conta-ausente@example.invalid"),
      throttleKey("reset-ip", "unknown"),
    ]]);
  } finally {
    await pool.end();
  }
}
