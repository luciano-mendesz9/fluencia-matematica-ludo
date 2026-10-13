import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { createNeonTestPool } from "../helpers/neon-pool";
import { authFixtures } from "./auth-fixtures";
import { login } from "./auth-helpers";

test.describe.configure({ mode: "serial" });

const correlationId = `fm023-e2e-${randomUUID()}`;
const logId = randomUUID();
const auditId = randomUUID();
const developerId = randomUUID();
const developerEmail = `fm023-e2e-${randomUUID()}@example.invalid`;

test.beforeAll(async ({}, testInfo) => {
  testInfo.setTimeout(90_000);
  const { pool } = createNeonTestPool();
  try {
    const baseUser = await pool.query('SELECT "passwordHash" FROM "User" WHERE "normalizedEmail"=$1', [authFixtures.adult.identifier]);
    await pool.query(`INSERT INTO "User" ("id","name","email","normalizedEmail","passwordHash","globalRole","status","sessionVersion","createdAt","updatedAt") VALUES ($1,'Desenvolvedor FM-023 E2E',$2,$2,$3,'DEVELOPER','ACTIVE',1,NOW(),NOW())`, [developerId, developerEmail, baseUser.rows[0].passwordHash]);
    await pool.query(`INSERT INTO "OperationalLog" ("id","level","category","code","message","correlationId","metadata","occurredAt") VALUES ($1,'ERROR','database','FM023_E2E_TIMEOUT','Falha técnica controlada',$2,$3::jsonb,NOW())`, [logId, correlationId, JSON.stringify({ durationMs: 180, studentName: "Aluno que não pode aparecer", token: "segredo-e2e", route: "https://example.invalid/operacao?password=segredo" })]);
    await pool.query(`INSERT INTO "AuditEvent" ("id","actorId","action","targetType","targetId","before","after","correlationId","at") VALUES ($1,$2,'ACTIVITY_CLOSED','Activity',$3,$4::jsonb,$5::jsonb,$6,NOW())`, [auditId, developerId, randomUUID(), JSON.stringify({ status: "OPEN" }), JSON.stringify({ status: "CLOSED", answer: "RESPOSTA-PRIVADA-E2E" }), correlationId]);
  } finally { await pool.end(); }
});

test.afterAll(async ({}, testInfo) => {
  testInfo.setTimeout(90_000);
  const { pool } = createNeonTestPool();
  try {
    await pool.query('DELETE FROM "OperationalLog" WHERE "id"=$1', [logId]);
    await pool.query('DELETE FROM "AuditEvent" WHERE "id"=$1 OR "actorId"=$2', [auditId, developerId]);
    await pool.query('DELETE FROM "Session" WHERE "userId"=$1', [developerId]);
    await pool.query('DELETE FROM "User" WHERE "id"=$1', [developerId]);
  } finally { await pool.end(); }
});

test("desenvolvedor consulta saúde, logs sanitizados e correlação sem acesso crítico", async ({ page }) => {
  await login(page, developerEmail);
  await expect(page).toHaveURL(/\/operacao$/);
  await expect(page.getByRole("heading", { name: "Saúde e eventos técnicos" })).toBeVisible();
  await expect(page.getByText("Banco de dados", { exact: true })).toBeVisible();
  await expect(page.getByText("Retenção protegida", { exact: true })).toBeVisible();

  await page.getByLabel("Correlation ID").fill(correlationId);
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page).toHaveURL(new RegExp(`correlationId=${correlationId}`));
  await expect(page.getByText("FM023_E2E_TIMEOUT", { exact: true })).toBeVisible();
  await expect(page.getByText("ACTIVITY_CLOSED", { exact: true })).toBeVisible();
  const body = page.locator("body");
  await expect(body).not.toContainText("Aluno que não pode aparecer");
  await expect(body).not.toContainText("segredo-e2e");
  await expect(body).not.toContainText("RESPOSTA-PRIVADA-E2E");

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/operacao$/);
  await page.goto("/admin/relatorios");
  await expect(page).toHaveURL(/\/operacao$/);
});

test("SEMED acessa a visão técnica sem receber dados pedagógicos individuais", async ({ page }) => {
  await login(page, authFixtures.adult.identifier);
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto(`/admin/operacao?correlationId=${correlationId}`);
  await expect(page.getByRole("heading", { name: "Saúde e eventos técnicos" })).toBeVisible();
  await expect(page.getByText("FM023_E2E_TIMEOUT", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Alunos no recorte" })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
