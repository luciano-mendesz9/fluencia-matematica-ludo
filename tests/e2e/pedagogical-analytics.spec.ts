import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { createNeonTestPool } from "../helpers/neon-pool";
import { authFixtures } from "./auth-fixtures";
import { login } from "./auth-helpers";

test.describe.configure({ mode: "serial" });

const fixture = { studentId: randomUUID(), studentCode: `FM022-E2E-${randomUUID().slice(0, 8)}`.toUpperCase(), enrollmentId: randomUUID(), themeId: randomUUID(), skillId: randomUUID(), questionIds: [randomUUID(), randomUUID()], versionIds: [randomUUID(), randomUUID()], activityId: randomUUID(), participationId: randomUUID(), gameId: randomUUID(), challengeIds: [randomUUID(), randomUUID()], attemptIds: [randomUUID(), randomUUID()] };
let schoolId = "";
let classId = "";

test.beforeAll(async () => {
  const { pool } = createNeonTestPool();
  try {
    const context = await pool.query(`SELECT teacher."id" AS "teacherId", teacher."passwordHash", school."id" AS "schoolId", class."id" AS "classId" FROM "User" teacher JOIN "School" school ON school."externalCode"=$1 JOIN "ClassGroup" class ON class."schoolId"=school."id" AND class."name"=$2 WHERE teacher."normalizedEmail"=$3`, [authFixtures.schools.schoolA.code, authFixtures.people.classA, authFixtures.schools.teacherOne.email]);
    const row = context.rows[0];
    schoolId = row.schoolId;
    classId = row.classId;
    await pool.query(`INSERT INTO "User" ("id","name","studentCode","passwordHash","status","sessionVersion","createdAt","updatedAt") VALUES ($1,'Aluno Analytics E2E',$2,$3,'ACTIVE',1,NOW(),NOW())`, [fixture.studentId, fixture.studentCode, row.passwordHash]);
    await pool.query(`INSERT INTO "Enrollment" ("id","studentId","schoolId","classId","status","startsAt","revision","createdAt","updatedAt") VALUES ($1,$2,$3,$4,'ACTIVE',NOW(),1,NOW(),NOW())`, [fixture.enrollmentId, fixture.studentId, schoolId, classId]);
    await pool.query(`INSERT INTO "Theme" ("id","name","normalizedName","status","revision","createdAt","updatedAt") VALUES ($1,'Números FM-022 E2E',$2,'ACTIVE',1,NOW(),NOW())`, [fixture.themeId, `numeros-fm022-e2e-${fixture.themeId}`]);
    await pool.query(`INSERT INTO "Skill" ("id","themeId","name","normalizedName","status","revision","createdAt","updatedAt") VALUES ($1,$2,'Adição contextual',$3,'ACTIVE',1,NOW(),NOW())`, [fixture.skillId, fixture.themeId, `adicao-fm022-e2e-${fixture.skillId}`]);
    for (let index = 0; index < 2; index += 1) {
      await pool.query(`INSERT INTO "Question" ("id","origin","ownerId","createdById","status","revision","latestVersionNumber","createdAt","updatedAt") VALUES ($1,'PRIVATE',$2,$2,'ACTIVE',1,1,NOW(),NOW())`, [fixture.questionIds[index], row.teacherId]);
      await pool.query(`INSERT INTO "QuestionVersion" ("id","questionId","versionNumber","grade","difficulty","themeId","skillId","statement","answerType","numericExpected","contentHash","createdById","createdAt") VALUES ($1,$2,1,4,3,$3,$4,$5,'NUMERIC',10,$6,$7,NOW())`, [fixture.versionIds[index], fixture.questionIds[index], fixture.themeId, fixture.skillId, `Questão Analytics ${index + 1}`, String(index + 1).padStart(64, "0"), row.teacherId]);
    }
    await pool.query(`INSERT INTO "Activity" ("id","schoolId","classId","teacherId","title","targetCount","status","revision","openedAt","createdAt","updatedAt") VALUES ($1,$2,$3,$4,'Analytics FM-022 E2E',1,'OPEN',1,NOW(),NOW(),NOW())`, [fixture.activityId, schoolId, classId, row.teacherId]);
    for (const versionId of fixture.versionIds) await pool.query(`INSERT INTO "ActivityQuestionVersion" ("activityId","questionVersionId","createdAt") VALUES ($1,$2,NOW())`, [fixture.activityId, versionId]);
    await pool.query(`INSERT INTO "ActivityParticipation" ("id","activityId","enrollmentId","studentId","acceptedAnswers","correctAnswers","incorrectAnswers","extraAnswers","targetReachedAt","revision","createdAt","updatedAt") VALUES ($1,$2,$3,$4,2,1,1,1,NOW(),1,NOW(),NOW())`, [fixture.participationId, fixture.activityId, fixture.enrollmentId, fixture.studentId]);
    await pool.query(`INSERT INTO "GameSession" ("id","participationId","status","phase","turn","boardVersion","rules","pieces","revision","errorCount","pointsEarned","startedAt","updatedAt") VALUES ($1,$2,'ACTIVE','RECOVERY_ROLL','STUDENT','fm022-e2e','{}'::jsonb,'[]'::jsonb,3,1,0,NOW(),NOW())`, [fixture.gameId, fixture.participationId]);
    for (let index = 0; index < 2; index += 1) {
      const clientActionId = randomUUID();
      const correct = index === 1;
      await pool.query(`INSERT INTO "GameChallenge" ("id","gameId","questionVersionId","difficulty","dice","status","isRepeated","sessionRevision","presentedAt","answeredAt") VALUES ($1,$2,$3,3,3,'ANSWERED',$4,$5,NOW(),NOW())`, [fixture.challengeIds[index], fixture.gameId, fixture.versionIds[index], index === 1, index + 1]);
      await pool.query(`INSERT INTO "AnswerAttempt" ("id","challengeId","gameId","participationId","clientActionId","response","outcome","errorStreakBefore","acceptedAt") VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,NOW())`, [fixture.attemptIds[index], fixture.challengeIds[index], fixture.gameId, fixture.participationId, clientActionId, JSON.stringify({ value: "SEGREDO-FM022" }), correct ? "CORRECT" : "INCORRECT", index]);
      await pool.query(`INSERT INTO "ActivityAnswerReceipt" ("id","participationId","clientActionId","outcome","acceptedNumber","isExtra","acceptedAt") VALUES ($1,$2,$3,$4,$5,$6,NOW())`, [randomUUID(), fixture.participationId, clientActionId, correct ? "CORRECT" : "INCORRECT", index + 1, index === 1]);
    }
  } finally { await pool.end(); }
});

test.afterAll(async () => {
  const { pool } = createNeonTestPool();
  try {
    await pool.query(`DELETE FROM "AnswerAttempt" WHERE "participationId"=$1`, [fixture.participationId]);
    await pool.query(`DELETE FROM "ActivityAnswerReceipt" WHERE "participationId"=$1`, [fixture.participationId]);
    await pool.query(`DELETE FROM "GameChallenge" WHERE "gameId"=$1`, [fixture.gameId]);
    await pool.query(`DELETE FROM "GameSession" WHERE "id"=$1`, [fixture.gameId]);
    await pool.query(`DELETE FROM "ActivityParticipation" WHERE "id"=$1`, [fixture.participationId]);
    await pool.query(`DELETE FROM "ActivityQuestionVersion" WHERE "activityId"=$1`, [fixture.activityId]);
    await pool.query(`DELETE FROM "Activity" WHERE "id"=$1`, [fixture.activityId]);
    await pool.query(`DELETE FROM "QuestionVersion" WHERE "id"=ANY($1::uuid[])`, [fixture.versionIds]);
    await pool.query(`DELETE FROM "Question" WHERE "id"=ANY($1::uuid[])`, [fixture.questionIds]);
    await pool.query(`DELETE FROM "Skill" WHERE "id"=$1`, [fixture.skillId]);
    await pool.query(`DELETE FROM "Theme" WHERE "id"=$1`, [fixture.themeId]);
    await pool.query(`DELETE FROM "Enrollment" WHERE "id"=$1`, [fixture.enrollmentId]);
    await pool.query(`DELETE FROM "Session" WHERE "userId"=$1`, [fixture.studentId]);
    await pool.query(`DELETE FROM "User" WHERE "id"=$1`, [fixture.studentId]);
  } finally { await pool.end(); }
});

async function enterSchool(page: import("@playwright/test").Page, identifier: string, destination: RegExp) {
  await login(page, identifier);
  await expect(page).not.toHaveURL(/\/login$/);
  if (/selecionar-escola/.test(page.url())) await page.getByRole("listitem").filter({ hasText: authFixtures.schools.schoolA.name }).getByRole("button", { name: "Acessar escola" }).click();
  await expect(page).toHaveURL(destination);
}

test("professor filtra, abre detalhe e vê denominadores sem dado cru", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await enterSchool(page, authFixtures.schools.teacherOne.email, /\/professor$/);
  await page.goto(`/professor/relatorios?classId=${classId}&activityId=${fixture.activityId}`);
  await expect(page.getByRole("heading", { name: "Participação, prática e precisão" })).toBeVisible();
  await expect(page.getByText("1 de 1 destinatários-atividade responderam.")).toBeVisible();
  await expect(page.getByText("1 acertos em 2 respostas aceitas.")).toBeVisible();
  await expect(page.getByText("Dados insuficientes", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Aluno Analytics E2E" })).toBeVisible();
  await page.getByRole("link", { name: "Aluno Analytics E2E" }).click();
  await expect(page).toHaveURL(new RegExp(`classId=${classId}.*activityId=${fixture.activityId}.*studentId=${fixture.studentId}`));
  await expect(page.locator("body")).not.toContainText("SEGREDO-FM022");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await context.close();
});

test("coordenação e SEMED acessam agregados conforme o papel", async ({ page }) => {
  await enterSchool(page, authFixtures.schools.coordinator.email, /\/escola$/);
  await page.goto(`/escola/relatorios?classId=${classId}`);
  await expect(page.getByRole("heading", { name: "Participação, prática e precisão" })).toBeVisible();
  await page.context().clearCookies();
  await login(page, authFixtures.adult.identifier);
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto(`/admin/relatorios?schoolId=${schoolId}&classId=${classId}`);
  await expect(page.getByText("1 acertos em 2 respostas aceitas.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Alunos no recorte" })).toHaveCount(0);
  await expect(page.getByText("Visão agregada da rede", { exact: true })).toBeVisible();
});

test("aluno vê somente o próprio progresso separado do ranking", async ({ page }) => {
  await login(page, fixture.studentCode);
  await expect(page).toHaveURL(/\/aluno$/);
  await page.goto("/aluno/resultados");
  await expect(page.getByRole("heading", { name: "Como foi sua prática" })).toBeVisible();
  await expect(page.getByText("Adição contextual", { exact: true }).first()).toBeVisible();
  await expect(page.locator("body")).not.toContainText("SEGREDO-FM022");
});
