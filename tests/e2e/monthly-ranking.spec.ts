import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { createNeonTestPool } from "../helpers/neon-pool";
import { authFixtures } from "./auth-fixtures";
import { login, loginAsStudent } from "./auth-helpers";

test.describe.configure({ mode: "serial" });

let activityId = "";
let enrollmentId = "";
let createdEnrollment = false;
let classId = "";

test.beforeAll(async () => {
  const { pool } = createNeonTestPool();
  try {
    const located = await pool.query(`SELECT student."id" AS "studentId", teacher."id" AS "teacherId", school."id" AS "schoolId", class."id" AS "classId" FROM "User" student, "User" teacher, "School" school, "ClassGroup" class WHERE student."studentCode"=$1 AND teacher."normalizedEmail"=$2 AND school."externalCode"=$3 AND class."schoolId"=school."id" AND class."name"=$4`, [authFixtures.student.identifier, authFixtures.schools.teacherOne.email, authFixtures.schools.schoolA.code, authFixtures.people.classA]);
    const row = located.rows[0];
    classId = row.classId;
    const existing = await pool.query(`SELECT "id" FROM "Enrollment" WHERE "studentId"=$1 AND "classId"=$2 AND "status"='ACTIVE'`, [row.studentId, row.classId]);
    enrollmentId = existing.rows[0]?.id ?? randomUUID();
    if (!existing.rows[0]) {
      createdEnrollment = true;
      await pool.query(`INSERT INTO "Enrollment" ("id","studentId","schoolId","classId","status","startsAt","revision","createdAt","updatedAt") VALUES ($1,$2,$3,$4,'ACTIVE',NOW(),1,NOW(),NOW())`, [enrollmentId, row.studentId, row.schoolId, row.classId]);
    }
    activityId = randomUUID();
    const participationId = randomUUID();
    const gameId = randomUUID();
    await pool.query(`INSERT INTO "Activity" ("id","schoolId","classId","teacherId","title","targetCount","status","revision","openedAt","createdAt","updatedAt") VALUES ($1,$2,$3,$4,'Ranking FM-021',1,'OPEN',1,NOW(),NOW(),NOW())`, [activityId, row.schoolId, row.classId, row.teacherId]);
    await pool.query(`INSERT INTO "ActivityParticipation" ("id","activityId","enrollmentId","studentId","pointsBalance","createdAt","updatedAt") VALUES ($1,$2,$3,$4,10,NOW(),NOW())`, [participationId, activityId, enrollmentId, row.studentId]);
    await pool.query(`INSERT INTO "GameSession" ("id","participationId","status","phase","turn","boardVersion","rules","pieces","pointsEarned","finishedAt","updatedAt") VALUES ($1,$2,'FINISHED','FINISHED','STUDENT','fm021-e2e','{}'::jsonb,'[]'::jsonb,10,NOW(),NOW())`, [gameId, participationId]);
    await pool.query(`INSERT INTO "PointEvent" ("id","participationId","studentId","classId","activityId","gameId","type","amount","awardedAt") VALUES ($1,$2,$3,$4,$5,$6,'VICTORY_BONUS',10,NOW())`, [randomUUID(), participationId, row.studentId, row.classId, activityId, gameId]);
  } finally { await pool.end(); }
});

test.afterAll(async () => {
  const { pool } = createNeonTestPool();
  try {
    await pool.query(`DELETE FROM "PointEvent" WHERE "activityId"=$1`, [activityId]);
    await pool.query(`DELETE FROM "GameSession" WHERE "participationId" IN (SELECT "id" FROM "ActivityParticipation" WHERE "activityId"=$1)`, [activityId]);
    await pool.query(`DELETE FROM "ActivityParticipation" WHERE "activityId"=$1`, [activityId]);
    await pool.query(`DELETE FROM "Activity" WHERE "id"=$1`, [activityId]);
    if (createdEnrollment) await pool.query(`DELETE FROM "Enrollment" WHERE "id"=$1`, [enrollmentId]);
  } finally { await pool.end(); }
});

async function enterTeacher(page: import("@playwright/test").Page) {
  await login(page, authFixtures.schools.teacherOne.email);
  await expect(page).not.toHaveURL(/\/login$/);
  if (/selecionar-escola/.test(page.url())) await page.getByRole("listitem").filter({ hasText: authFixtures.schools.schoolA.name }).getByRole("button", { name: "Acessar escola" }).click();
  await expect(page).toHaveURL(/\/professor$/);
}

test("aluno vê o ranking mensal responsivo, com nome completo e sem rota histórica", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await loginAsStudent(page);
  await expect(page).toHaveURL(/\/aluno$/);
  await page.goto("/aluno/ranking");
  await expect(page.getByRole("heading", { name: /Ranking de outubro de 2026/i })).toBeVisible();
  await expect(page.getByText(authFixtures.student.name, { exact: true })).toBeVisible();
  await expect(page.getByText("10", { exact: true })).toBeVisible();
  await expect(page.getByText("Você", { exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(authFixtures.student.identifier);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const historyResponse = await page.goto("/aluno/ranking/2026-09");
  await expect(page).toHaveURL(/\/aluno\/ranking\/2026-09$/);
  expect(historyResponse?.status()).toBe(404);
  await context.close();
});

test("professor acessa somente o ranking da turma atribuída", async ({ page }) => {
  await enterTeacher(page);
  await page.goto(`/professor/turmas/${classId}`);
  await expect(page.getByRole("heading", { name: authFixtures.people.classA })).toBeVisible();
  await expect(page.getByText(authFixtures.student.name, { exact: true })).toBeVisible();
  await expect(page.getByText("10", { exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(authFixtures.student.identifier);
  const hostileResponse = await page.goto(`/professor/turmas/${randomUUID()}`);
  expect(hostileResponse?.status()).toBe(404);
});
