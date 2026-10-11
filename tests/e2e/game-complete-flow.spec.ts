import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { createNeonTestPool } from "../helpers/neon-pool";
import { authFixtures } from "./auth-fixtures";
import { loginAsStudent } from "./auth-helpers";

test.describe.configure({ mode: "serial" });

let activityId = "";
let enrollmentId = "";
let createdEnrollment = false;
let themeId = "";
let studentId = "";
const questionIds: string[] = [];

test.beforeAll(async () => {
  const { pool } = createNeonTestPool();
  try {
    const located = await pool.query(`SELECT student."id" AS "studentId", teacher."id" AS "teacherId", school."id" AS "schoolId", class."id" AS "classId" FROM "User" student, "User" teacher, "School" school, "ClassGroup" class WHERE student."studentCode"=$1 AND teacher."normalizedEmail"=$2 AND school."externalCode"=$3 AND class."schoolId"=school."id" AND class."name"=$4`, [authFixtures.student.identifier, authFixtures.schools.teacherOne.email, authFixtures.schools.schoolA.code, authFixtures.people.classA]);
    const row = located.rows[0]; studentId = row.studentId;
    const enrollment = await pool.query(`SELECT "id" FROM "Enrollment" WHERE "studentId"=$1 AND "classId"=$2 AND "status"='ACTIVE'`, [row.studentId, row.classId]);
    enrollmentId = enrollment.rows[0]?.id ?? randomUUID();
    if (!enrollment.rows[0]) { createdEnrollment = true; await pool.query(`INSERT INTO "Enrollment" ("id","studentId","schoolId","classId","status","startsAt","revision","createdAt","updatedAt") VALUES ($1,$2,$3,$4,'ACTIVE',NOW(),1,NOW(),NOW())`, [enrollmentId, row.studentId, row.schoolId, row.classId]); }
    themeId = randomUUID();
    await pool.query(`INSERT INTO "Theme" ("id","name","normalizedName","status","revision","createdAt","updatedAt") VALUES ($1,$2,$3,'ACTIVE',1,NOW(),NOW())`, [themeId, `FM020 E2E ${themeId}`, `fm020-${themeId}`]);
    const versionIds: string[] = [];
    for (let difficulty = 1; difficulty <= 6; difficulty += 1) {
      const questionId = randomUUID(); const versionId = randomUUID(); questionIds.push(questionId); versionIds.push(versionId);
      await pool.query(`INSERT INTO "Question" ("id","origin","ownerId","createdById","status","revision","latestVersionNumber","createdAt","updatedAt") VALUES ($1,'PRIVATE',$2,$2,'ACTIVE',1,1,NOW(),NOW())`, [questionId, row.teacherId]);
      await pool.query(`INSERT INTO "QuestionVersion" ("id","questionId","versionNumber","grade","difficulty","themeId","statement","answerType","numericExpected","explanation","contentHash","createdById","createdAt") VALUES ($1,$2,1,4,$3,$4,$5,'NUMERIC',$6,$7,$8,$9,NOW())`, [versionId, questionId, difficulty, themeId, `Digite o número ${difficulty}.`, String(difficulty), `A resposta é ${difficulty}.`, String(difficulty).padEnd(64, "0"), row.teacherId]);
    }
    activityId = randomUUID();
    await pool.query(`INSERT INTO "Activity" ("id","schoolId","classId","teacherId","title","targetCount","status","revision","openedAt","createdAt","updatedAt") VALUES ($1,$2,$3,$4,'Jogo completo FM-020',2,'OPEN',1,NOW(),NOW(),NOW())`, [activityId, row.schoolId, row.classId, row.teacherId]);
    for (const versionId of versionIds) await pool.query(`INSERT INTO "ActivityQuestionVersion" ("activityId","questionVersionId","createdAt") VALUES ($1,$2,NOW())`, [activityId, versionId]);
    await pool.query(`INSERT INTO "ActivityParticipation" ("id","activityId","enrollmentId","studentId","createdAt","updatedAt") VALUES ($1,$2,$3,$4,NOW(),NOW())`, [randomUUID(), activityId, enrollmentId, row.studentId]);
  } finally { await pool.end(); }
});

test.afterAll(async () => {
  const { pool } = createNeonTestPool();
  try {
    if (activityId) {
      const params = [activityId];
      const gameScope = `SELECT g."id" FROM "GameSession" g JOIN "ActivityParticipation" p ON p."id"=g."participationId" WHERE p."activityId"=$1`;
      await pool.query(`DELETE FROM "PointEvent" WHERE "gameId" IN (${gameScope})`, params);
      await pool.query(`DELETE FROM "GameAction" WHERE "gameId" IN (${gameScope})`, params);
      await pool.query(`DELETE FROM "AnswerAttempt" WHERE "gameId" IN (${gameScope})`, params);
      await pool.query(`DELETE FROM "GameChallenge" WHERE "gameId" IN (${gameScope})`, params);
      await pool.query(`DELETE FROM "GameSession" WHERE "participationId" IN (SELECT "id" FROM "ActivityParticipation" WHERE "activityId"=$1)`, params);
      await pool.query(`DELETE FROM "ActivityAnswerReceipt" WHERE "participationId" IN (SELECT "id" FROM "ActivityParticipation" WHERE "activityId"=$1)`, params);
      await pool.query(`DELETE FROM "ActivityParticipation" WHERE "activityId"=$1`, params);
      await pool.query(`DELETE FROM "ActivityQuestionVersion" WHERE "activityId"=$1`, params);
      await pool.query(`DELETE FROM "Activity" WHERE "id"=$1`, params);
    }
    await pool.query(`DELETE FROM "QuestionVersion" WHERE "questionId"=ANY($1::uuid[])`, [questionIds]);
    await pool.query(`DELETE FROM "Question" WHERE "id"=ANY($1::uuid[])`, [questionIds]);
    if (themeId) await pool.query(`DELETE FROM "Theme" WHERE "id"=$1`, [themeId]);
    if (createdEnrollment && enrollmentId) await pool.query(`DELETE FROM "Enrollment" WHERE "id"=$1`, [enrollmentId]);
  } finally { await pool.end(); }
});

test("retoma desafio e movimento, reconcilia duas abas e bloqueia ações offline", async ({ browser }) => {
  test.setTimeout(150_000);
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await loginAsStudent(page);
  await expect(page).toHaveURL(/\/aluno$/);
  await page.goto(`/aluno/atividades/${activityId}`);
  await page.getByRole("button", { name: "Iniciar partida" }).click();
  await expect(page).toHaveURL(new RegExp(`/aluno/atividades/${activityId}/jogo`));
  for (let attempt = 0; attempt < 50 && await page.getByText(/Digite o número [1-6]\./).count() === 0; attempt += 1) {
    await page.getByRole("button", { name: "Jogar dado" }).click();
    await expect(page.getByRole("button", { name: "Aguarde..." })).toHaveCount(0, { timeout: 15_000 });
  }
  const statement = page.getByText(/Digite o número [1-6]\./);
  await expect(statement).toBeVisible();
  const answer = (await statement.textContent())!.match(/[1-6]/)![0];
  await page.reload();
  await expect(page.getByText(`Digite o número ${answer}.`)).toBeVisible();
  await page.getByLabel("Sua resposta").fill(answer);
  await page.getByRole("button", { name: "Confirmar resposta" }).click();
  await expect(page.getByText(/Resposta correta! \+10 pontos/)).toBeVisible();
  await expect(page.getByText("Escolha o pino que deseja mover")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Escolha o pino que deseja mover")).toBeVisible();

  const second = await context.newPage();
  await second.goto(page.url());
  await expect(second.getByRole("button", { name: /Mover pino/ }).first()).toBeVisible();
  await page.getByRole("button", { name: /Mover pino/ }).first().click();
  await expect(page.getByRole("button", { name: "Jogar dado" })).toBeVisible();
  await second.getByRole("button", { name: /Mover pino/ }).first().click();
  await expect(second.getByRole("button", { name: "Jogar dado" })).toBeVisible();
  await expect(second.getByText("10", { exact: true }).first()).toBeVisible();

  await context.setOffline(true);
  await expect(page.getByText(/Sem conexão\. As ações estão desativadas/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Sem conexão" })).toBeDisabled();
  await context.setOffline(false);
  await expect(page.getByRole("button", { name: "Jogar dado" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const { pool } = createNeonTestPool();
  try {
    const totals = await pool.query(`SELECT p."acceptedAnswers",p."correctAnswers",p."pointsBalance",COUNT(e."id")::int AS events,SUM(e."amount")::int AS points FROM "ActivityParticipation" p LEFT JOIN "PointEvent" e ON e."participationId"=p."id" WHERE p."activityId"=$1 AND p."studentId"=$2 GROUP BY p."id"`, [activityId, studentId]);
    expect(totals.rows[0]).toMatchObject({ acceptedAnswers: 1, correctAnswers: 1, pointsBalance: 10, events: 1, points: 10 });
  } finally { await pool.end(); }
  await context.close();
});
