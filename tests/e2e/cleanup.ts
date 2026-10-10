import type { Pool } from "@neondatabase/serverless";

export async function cleanupActivityFixtures(
  pool: Pool,
  userIds: readonly string[],
  schoolIds: readonly string[],
): Promise<void> {
  const activities = await pool.query(
    `SELECT DISTINCT a."id"
       FROM "Activity" a
       LEFT JOIN "ActivityParticipation" ap ON ap."activityId" = a."id"
      WHERE a."teacherId" = ANY($1::uuid[])
         OR a."schoolId" = ANY($2::uuid[])
         OR ap."studentId" = ANY($1::uuid[])`,
    [userIds, schoolIds],
  );
  const activityIds = activities.rows.map((row) => row.id);

  await pool.query(
    `DELETE FROM "GameAction" WHERE "gameId" IN (
      SELECT "id" FROM "GameSession" WHERE "participationId" IN (
        SELECT "id" FROM "ActivityParticipation"
         WHERE "activityId" = ANY($1::uuid[]) OR "studentId" = ANY($2::uuid[])
      )
    )`,
    [activityIds, userIds],
  );
  await pool.query(
    `DELETE FROM "GameChallenge" WHERE "gameId" IN (
      SELECT "id" FROM "GameSession" WHERE "participationId" IN (
        SELECT "id" FROM "ActivityParticipation"
         WHERE "activityId" = ANY($1::uuid[]) OR "studentId" = ANY($2::uuid[])
      )
    )`,
    [activityIds, userIds],
  );
  await pool.query(
    `DELETE FROM "GameSession" WHERE "participationId" IN (
      SELECT "id" FROM "ActivityParticipation"
       WHERE "activityId" = ANY($1::uuid[]) OR "studentId" = ANY($2::uuid[])
    )`,
    [activityIds, userIds],
  );

  await pool.query(
    `DELETE FROM "ActivityAnswerReceipt"
      WHERE "participationId" IN (
        SELECT "id" FROM "ActivityParticipation"
         WHERE "activityId" = ANY($1::uuid[]) OR "studentId" = ANY($2::uuid[])
      )`,
    [activityIds, userIds],
  );
  await pool.query(
    'DELETE FROM "ActivityParticipation" WHERE "activityId" = ANY($1::uuid[]) OR "studentId" = ANY($2::uuid[])',
    [activityIds, userIds],
  );
  await pool.query('DELETE FROM "ActivityQuestionVersion" WHERE "activityId" = ANY($1::uuid[])', [activityIds]);
  await pool.query(
    `DELETE FROM "ActivityQuestionVersion"
      WHERE "questionVersionId" IN (
        SELECT qv."id"
          FROM "QuestionVersion" qv
          JOIN "Question" q ON q."id" = qv."questionId"
         WHERE q."createdById" = ANY($1::uuid[])
            OR q."ownerId" = ANY($1::uuid[])
            OR q."sourceQuestionId" IN (
              SELECT source."id" FROM "Question" source
               WHERE source."createdById" = ANY($1::uuid[]) OR source."ownerId" = ANY($1::uuid[])
            )
      )`,
    [userIds],
  );
  await pool.query(
    `DELETE FROM "AuditEvent"
      WHERE "targetType" = 'Activity' AND "targetId" = ANY($1::text[])`,
    [activityIds],
  );
  await pool.query('DELETE FROM "Activity" WHERE "id" = ANY($1::uuid[])', [activityIds]);
}
