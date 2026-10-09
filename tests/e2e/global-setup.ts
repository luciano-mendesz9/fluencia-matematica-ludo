import "dotenv/config";
import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import { assertNeonTestMarker, createNeonTestPool } from "../helpers/neon-pool";
import { sha256, throttleKey } from "../../src/server/auth/crypto";
import { authFixtures } from "./auth-fixtures";

export default async function globalSetup() {
  const { pool, environment } = createNeonTestPool();
  try {
    await assertNeonTestMarker(pool, environment.appEnvId);
    const passwordHash = await bcrypt.hash(authFixtures.password, 10);
    await pool.query(`
      INSERT INTO "User" ("id", "name", "email", "normalizedEmail", "passwordHash", "status", "globalRole", "sessionVersion", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $3, $4, 'ACTIVE', 'SEMED_ADMIN', 1, NOW(), NOW())
      ON CONFLICT ("normalizedEmail") DO UPDATE SET
        "name" = EXCLUDED."name", "passwordHash" = EXCLUDED."passwordHash", "status" = 'ACTIVE',
        "globalRole" = 'SEMED_ADMIN', "sessionVersion" = "User"."sessionVersion" + 1, "updatedAt" = NOW()
    `, [randomUUID(), authFixtures.adult.name, authFixtures.adult.identifier, passwordHash]);
    await pool.query(`
      INSERT INTO "User" ("id", "name", "studentCode", "passwordHash", "status", "sessionVersion", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, 'ACTIVE', 1, NOW(), NOW())
      ON CONFLICT ("studentCode") DO UPDATE SET
        "name" = EXCLUDED."name", "passwordHash" = EXCLUDED."passwordHash", "status" = 'ACTIVE',
        "sessionVersion" = "User"."sessionVersion" + 1, "updatedAt" = NOW()
    `, [randomUUID(), authFixtures.student.name, authFixtures.student.identifier, passwordHash]);
    await pool.query(`
      INSERT INTO "User" ("id", "name", "email", "normalizedEmail", "passwordHash", "status", "sessionVersion", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $3, $4, 'BLOCKED', 1, NOW(), NOW())
      ON CONFLICT ("normalizedEmail") DO UPDATE SET
        "name" = EXCLUDED."name", "passwordHash" = EXCLUDED."passwordHash", "status" = 'BLOCKED',
        "sessionVersion" = "User"."sessionVersion" + 1, "updatedAt" = NOW()
    `, [randomUUID(), authFixtures.blocked.name, authFixtures.blocked.identifier, passwordHash]);
    for (const email of [authFixtures.recovery.requestEmail, authFixtures.recovery.resetEmail]) {
      await pool.query(`
        INSERT INTO "User" ("id", "name", "email", "normalizedEmail", "passwordHash", "status", "sessionVersion", "createdAt", "updatedAt")
        VALUES ($1, 'Adulto FM-005', $2, $2, $3, 'ACTIVE', 1, NOW(), NOW())
        ON CONFLICT ("normalizedEmail") DO UPDATE SET
          "passwordHash" = EXCLUDED."passwordHash", "status" = 'ACTIVE',
          "sessionVersion" = "User"."sessionVersion" + 1, "updatedAt" = NOW()
      `, [randomUUID(), email, passwordHash]);
    }
    await pool.query(`
      INSERT INTO "User" ("id", "name", "email", "normalizedEmail", "passwordHash", "status", "globalRole", "sessionVersion", "createdAt", "updatedAt")
      VALUES ($1, 'SEMED FM-005', $2, $2, $3, 'ACTIVE', 'SEMED_ADMIN', 1, NOW(), NOW())
      ON CONFLICT ("normalizedEmail") DO UPDATE SET
        "passwordHash" = EXCLUDED."passwordHash", "status" = 'ACTIVE', "globalRole" = 'SEMED_ADMIN',
        "sessionVersion" = "User"."sessionVersion" + 1, "updatedAt" = NOW()
    `, [randomUUID(), authFixtures.recovery.adminEmail, passwordHash]);
    await pool.query(`
      INSERT INTO "User" ("id", "name", "studentCode", "passwordHash", "status", "sessionVersion", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, 'ACTIVE', 1, NOW(), NOW())
      ON CONFLICT ("studentCode") DO UPDATE SET
        "name" = EXCLUDED."name", "passwordHash" = EXCLUDED."passwordHash", "status" = 'ACTIVE',
      "sessionVersion" = "User"."sessionVersion" + 1, "updatedAt" = NOW()
    `, [randomUUID(), authFixtures.recovery.studentName, authFixtures.recovery.studentCode, passwordHash]);

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
    const staleUsers = await pool.query('SELECT "id" FROM "User" WHERE "normalizedEmail" = ANY($1::text[]) OR "name" = $2', [cleanupEmails, authFixtures.students.name]);
    const staleSchools = await pool.query('SELECT "id" FROM "School" WHERE "externalCode" = ANY($1::text[])', [schoolCodes]);
    const staleUserIds = staleUsers.rows.map((row) => row.id);
    const staleSchoolIds = staleSchools.rows.map((row) => row.id);
    const staleMemberships = await pool.query('SELECT "id" FROM "SchoolMembership" WHERE "userId" = ANY($1::uuid[]) OR "schoolId" = ANY($2::uuid[])', [staleUserIds, staleSchoolIds]);
    const staleMembershipIds = staleMemberships.rows.map((row) => row.id);
    await pool.query('DELETE FROM "QuestionSubmission" WHERE "submitterId" = ANY($1::uuid[]) OR "reviewerId" = ANY($1::uuid[])', [staleUserIds]);
    await pool.query('DELETE FROM "QuestionMedia" WHERE "versionId" IN (SELECT qv."id" FROM "QuestionVersion" qv JOIN "Question" q ON q.id=qv."questionId" WHERE q."createdById" = ANY($1::uuid[]) OR q."ownerId" = ANY($1::uuid[]) OR q."sourceQuestionId" IN (SELECT source."id" FROM "Question" source WHERE source."createdById" = ANY($1::uuid[]) OR source."ownerId" = ANY($1::uuid[])))', [staleUserIds]);
    await pool.query('DELETE FROM "QuestionOption" WHERE "versionId" IN (SELECT qv."id" FROM "QuestionVersion" qv JOIN "Question" q ON q.id=qv."questionId" WHERE q."createdById" = ANY($1::uuid[]) OR q."ownerId" = ANY($1::uuid[]) OR q."sourceQuestionId" IN (SELECT source."id" FROM "Question" source WHERE source."createdById" = ANY($1::uuid[]) OR source."ownerId" = ANY($1::uuid[])))', [staleUserIds]);
    await pool.query('DELETE FROM "QuestionVersion" WHERE "questionId" IN (SELECT "id" FROM "Question" WHERE "sourceQuestionId" IS NOT NULL AND ("createdById" = ANY($1::uuid[]) OR "ownerId" = ANY($1::uuid[]) OR "sourceQuestionId" IN (SELECT source."id" FROM "Question" source WHERE source."createdById" = ANY($1::uuid[]) OR source."ownerId" = ANY($1::uuid[]))))', [staleUserIds]);
    await pool.query('DELETE FROM "Question" WHERE "sourceQuestionId" IS NOT NULL AND ("createdById" = ANY($1::uuid[]) OR "ownerId" = ANY($1::uuid[]) OR "sourceQuestionId" IN (SELECT source."id" FROM "Question" source WHERE source."createdById" = ANY($1::uuid[]) OR source."ownerId" = ANY($1::uuid[])))', [staleUserIds]);
    await pool.query('DELETE FROM "QuestionVersion" WHERE "questionId" IN (SELECT "id" FROM "Question" WHERE "createdById" = ANY($1::uuid[]) OR "ownerId" = ANY($1::uuid[]))', [staleUserIds]);
    await pool.query('DELETE FROM "Question" WHERE "createdById" = ANY($1::uuid[]) OR "ownerId" = ANY($1::uuid[])', [staleUserIds]);
    await pool.query(
      'DELETE FROM "AuditEvent" WHERE "actorId" = ANY($1::uuid[]) OR "targetId" = ANY($2::text[]) OR "schoolId" = ANY($3::uuid[])',
      [staleUserIds, [...staleUserIds, ...staleSchoolIds, ...staleMembershipIds], staleSchoolIds],
    );
    await pool.query('DELETE FROM "Session" WHERE "userId" = ANY($1::uuid[])', [staleUserIds]);
    await pool.query('DELETE FROM "PasswordReset" WHERE "userId" = ANY($1::uuid[])', [staleUserIds]);
    await pool.query('DELETE FROM "Enrollment" WHERE "studentId" = ANY($1::uuid[]) OR "schoolId" = ANY($2::uuid[])', [staleUserIds, staleSchoolIds]);
    await pool.query('DELETE FROM "TeacherClassAssignment" WHERE "teacherId" = ANY($1::uuid[]) OR "schoolId" = ANY($2::uuid[])', [staleUserIds, staleSchoolIds]);
    await pool.query('DELETE FROM "ClassGroup" WHERE "schoolId" = ANY($1::uuid[])', [staleSchoolIds]);
    await pool.query('DELETE FROM "AcademicYear" WHERE "schoolId" = ANY($1::uuid[])', [staleSchoolIds]);
    await pool.query('DELETE FROM "SchoolMembership" WHERE "userId" = ANY($1::uuid[]) OR "schoolId" = ANY($2::uuid[])', [staleUserIds, staleSchoolIds]);
    await pool.query('DELETE FROM "School" WHERE "id" = ANY($1::uuid[])', [staleSchoolIds]);
    await pool.query('DELETE FROM "User" WHERE "id" = ANY($1::uuid[])', [staleUserIds]);

    for (const user of [
      authFixtures.schools.teacherOne,
      authFixtures.schools.teacherTwo,
      authFixtures.schools.coordinator,
      authFixtures.schools.linkCandidate,
      authFixtures.schools.noMembership,
      authFixtures.schools.multiTeacher,
    ]) {
      await pool.query(`
        INSERT INTO "User" ("id", "name", "email", "normalizedEmail", "passwordHash", "status", "sessionVersion", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $3, $4, 'ACTIVE', 1, NOW(), NOW())
      `, [randomUUID(), user.name, user.email, passwordHash]);
    }
    for (const school of [authFixtures.schools.schoolA, authFixtures.schools.schoolB, authFixtures.schools.schoolC]) {
      await pool.query(`
        INSERT INTO "School" ("id", "name", "externalCode", "status", "revision", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, 'ACTIVE', 1, NOW(), NOW())
      `, [randomUUID(), school.name, school.code]);
    }
    const schoolRows = await pool.query('SELECT "id", "externalCode" FROM "School" WHERE "externalCode" = ANY($1::text[])', [schoolCodes]);
    const userRows = await pool.query('SELECT "id", "normalizedEmail" FROM "User" WHERE "normalizedEmail" = ANY($1::text[])', [schoolEmails]);
    const schoolId = (code: string) => schoolRows.rows.find((row) => row.externalCode === code).id;
    const userId = (email: string) => userRows.rows.find((row) => row.normalizedEmail === email).id;
    for (const membership of [
      { email: authFixtures.schools.teacherOne.email, code: authFixtures.schools.schoolA.code, role: "TEACHER" },
      { email: authFixtures.schools.teacherOne.email, code: authFixtures.schools.schoolB.code, role: "TEACHER" },
      { email: authFixtures.schools.teacherTwo.email, code: authFixtures.schools.schoolC.code, role: "TEACHER" },
      { email: authFixtures.schools.coordinator.email, code: authFixtures.schools.schoolA.code, role: "COORDINATOR" },
      { email: authFixtures.schools.multiTeacher.email, code: authFixtures.schools.schoolA.code, role: "TEACHER" },
      { email: authFixtures.schools.multiTeacher.email, code: authFixtures.schools.schoolB.code, role: "TEACHER" },
    ]) {
      await pool.query(`
        INSERT INTO "SchoolMembership" ("id", "userId", "schoolId", "role", "status", "startsAt", "revision", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4::"SchoolMembershipRole", 'ACTIVE', NOW(), 1, NOW(), NOW())
      `, [randomUUID(), userId(membership.email), schoolId(membership.code), membership.role]);
    }

    for (const fixture of [
      { code: authFixtures.schools.schoolA.code, className: authFixtures.people.classA },
      { code: authFixtures.schools.schoolB.code, className: authFixtures.people.classB },
    ]) {
      const academicYearId = randomUUID();
      const classId = randomUUID();
      await pool.query(`
        INSERT INTO "AcademicYear" ("id", "schoolId", "year", "status", "revision", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, 'ACTIVE', 1, NOW(), NOW())
      `, [academicYearId, schoolId(fixture.code), authFixtures.people.year]);
      await pool.query(`
        INSERT INTO "ClassGroup" ("id", "schoolId", "academicYearId", "grade", "name", "normalizedName", "status", "revision", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, 4, $4, $5, 'ACTIVE', 1, NOW(), NOW())
      `, [classId, schoolId(fixture.code), academicYearId, fixture.className, fixture.className.toLocaleLowerCase("pt-BR")]);
      if (fixture.code === authFixtures.schools.schoolA.code) {
        const membership = await pool.query(
          'SELECT "id" FROM "SchoolMembership" WHERE "userId" = $1 AND "schoolId" = $2 AND "role" = \'TEACHER\'',
          [userId(authFixtures.schools.teacherOne.email), schoolId(fixture.code)],
        );
        await pool.query(`
          INSERT INTO "TeacherClassAssignment" ("id", "membershipId", "teacherId", "schoolId", "classId", "status", "startsAt", "revision", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, 'ACTIVE', NOW(), 1, NOW(), NOW())
        `, [randomUUID(), membership.rows[0].id, userId(authFixtures.schools.teacherOne.email), schoolId(fixture.code), classId]);
      }
    }

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
    await pool.query('DELETE FROM "QuestionSubmission" WHERE "submitterId" = ANY($1::uuid[]) OR "reviewerId" = ANY($1::uuid[])', [fixtureUserIds]);
    await pool.query('DELETE FROM "QuestionMedia" WHERE "versionId" IN (SELECT qv."id" FROM "QuestionVersion" qv JOIN "Question" q ON q.id=qv."questionId" WHERE q."createdById" = ANY($1::uuid[]) OR q."ownerId" = ANY($1::uuid[]) OR q."sourceQuestionId" IN (SELECT source."id" FROM "Question" source WHERE source."createdById" = ANY($1::uuid[]) OR source."ownerId" = ANY($1::uuid[])))', [fixtureUserIds]);
    await pool.query('DELETE FROM "QuestionOption" WHERE "versionId" IN (SELECT qv."id" FROM "QuestionVersion" qv JOIN "Question" q ON q.id=qv."questionId" WHERE q."createdById" = ANY($1::uuid[]) OR q."ownerId" = ANY($1::uuid[]) OR q."sourceQuestionId" IN (SELECT source."id" FROM "Question" source WHERE source."createdById" = ANY($1::uuid[]) OR source."ownerId" = ANY($1::uuid[])))', [fixtureUserIds]);
    await pool.query('DELETE FROM "QuestionVersion" WHERE "questionId" IN (SELECT "id" FROM "Question" WHERE "sourceQuestionId" IS NOT NULL AND ("createdById" = ANY($1::uuid[]) OR "ownerId" = ANY($1::uuid[]) OR "sourceQuestionId" IN (SELECT source."id" FROM "Question" source WHERE source."createdById" = ANY($1::uuid[]) OR source."ownerId" = ANY($1::uuid[]))))', [fixtureUserIds]);
    await pool.query('DELETE FROM "Question" WHERE "sourceQuestionId" IS NOT NULL AND ("createdById" = ANY($1::uuid[]) OR "ownerId" = ANY($1::uuid[]) OR "sourceQuestionId" IN (SELECT source."id" FROM "Question" source WHERE source."createdById" = ANY($1::uuid[]) OR source."ownerId" = ANY($1::uuid[])))', [fixtureUserIds]);
    await pool.query('DELETE FROM "QuestionVersion" WHERE "questionId" IN (SELECT "id" FROM "Question" WHERE "createdById" = ANY($1::uuid[]) OR "ownerId" = ANY($1::uuid[]))', [fixtureUserIds]);
    await pool.query('DELETE FROM "Question" WHERE "createdById" = ANY($1::uuid[]) OR "ownerId" = ANY($1::uuid[])', [fixtureUserIds]);
    await pool.query('DELETE FROM "Skill" WHERE "themeId" IN (SELECT "id" FROM "Theme" WHERE "normalizedName" = $1)', ['algebra fm-010 e2e']);
    await pool.query('DELETE FROM "Theme" WHERE "normalizedName" = $1', ['algebra fm-010 e2e']);
    await pool.query('DELETE FROM "Skill" WHERE "themeId" IN (SELECT "id" FROM "Theme" WHERE "normalizedName" = $1)', ['algebra fm-011 e2e']);
    await pool.query('DELETE FROM "Theme" WHERE "normalizedName" = $1', ['algebra fm-011 e2e']);
    await pool.query(
      'DELETE FROM "AuditEvent" WHERE "actorId" = ANY($1::uuid[]) OR "targetId" = ANY($2::text[])',
      [fixtureUserIds, fixtureUserIds],
    );
    const resetUser = await pool.query('SELECT "id" FROM "User" WHERE "normalizedEmail" = $1', [authFixtures.recovery.resetEmail]);
    await pool.query('DELETE FROM "PasswordReset" WHERE "userId" = $1', [resetUser.rows[0].id]);
    await pool.query(`
      INSERT INTO "PasswordReset" ("id", "userId", "tokenHash", "expiresAt", "createdAt")
      VALUES ($1, $2, $3, NOW() + INTERVAL '30 minutes', NOW())
    `, [randomUUID(), resetUser.rows[0].id, sha256(authFixtures.recovery.resetToken)]);
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
