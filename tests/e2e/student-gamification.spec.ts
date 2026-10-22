import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { createNeonTestPool } from "../helpers/neon-pool";
import { authFixtures } from "./auth-fixtures";
import { loginAsStudent } from "./auth-helpers";

let createdEnrollmentId: string | null = null;

test.beforeAll(async () => {
  const { pool } = createNeonTestPool();
  try {
    const located = await pool.query(`
      SELECT student."id" AS "studentId", school."id" AS "schoolId", class."id" AS "classId"
      FROM "User" student, "School" school, "ClassGroup" class
      WHERE student."studentCode" = $1
        AND school."externalCode" = $2
        AND class."schoolId" = school."id"
        AND class."name" = $3
    `, [authFixtures.student.identifier, authFixtures.schools.schoolA.code, authFixtures.people.classA]);
    const target = located.rows[0];
    if (!target) throw new Error("Fixture de aluno/turma da FM-028 não encontrada.");
    const active = await pool.query(`
      SELECT "id" FROM "Enrollment"
      WHERE "studentId" = $1 AND "status" = 'ACTIVE'
        AND "startsAt" <= NOW() AND ("endsAt" IS NULL OR "endsAt" > NOW())
    `, [target.studentId]);
    if (!active.rows[0]) {
      createdEnrollmentId = randomUUID();
      await pool.query(`
        INSERT INTO "Enrollment" ("id", "studentId", "schoolId", "classId", "status", "startsAt", "revision", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, 'ACTIVE', NOW(), 1, NOW(), NOW())
      `, [createdEnrollmentId, target.studentId, target.schoolId, target.classId]);
    }
  } finally {
    await pool.end();
  }
});

test.afterAll(async () => {
  if (!createdEnrollmentId) return;
  const { pool } = createNeonTestPool();
  try {
    await pool.query('DELETE FROM "Enrollment" WHERE "id" = $1', [createdEnrollmentId]);
  } finally {
    await pool.end();
  }
});

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

test("aluno navega pela experiência gamificada em 390 px sem estados demonstrativos", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loginAsStudent(page);
  await expect(page).toHaveURL(/\/aluno$/);
  await expect(page.getByText("XP total", { exact: true })).toBeVisible();
  await expect(page.getByText("Sequência", { exact: true })).toBeVisible();
  const navigation = page.getByRole("navigation", { name: "Navegação principal" });
  for (const label of ["Início", "Jogos", "Ranking", "Conquistas", "Perfil"]) await expect(navigation.getByRole("link", { name: label })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await navigation.getByRole("link", { name: "Jogos" }).click();
  await expect(page.getByRole("heading", { name: "Arena de jogos 🎮" })).toBeVisible();
  const ludo = page.locator(".student-game-list-card").filter({ hasText: "Ludo matemático" });
  await expect(ludo.getByText("Ludo matemático", { exact: true })).toBeVisible();
  const mathRace = page.locator(".student-game-list-card").filter({ hasText: "Corrida Matemática" });
  await expect(mathRace.getByText("Corrida Matemática", { exact: true })).toBeVisible();
  await expect(mathRace.getByText("🔒 EM DESENVOLVIMENTO", { exact: true })).toBeVisible();
  await expect(page.locator(".student-game-list-card")).toHaveCount(2);
  await expect(page.getByRole("heading", { name: "Próximas missões 🔒" })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole("navigation", { name: "Navegação principal" }).getByRole("link", { name: "Conquistas" }).click();
  await expect(page.getByRole("heading", { name: "Conquistas 🏅" })).toBeVisible();
  await expect(page.getByText(/desbloqueadas/)).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole("navigation", { name: "Navegação principal" }).getByRole("link", { name: "Perfil" }).click();
  await expect(page.getByRole("heading", { name: "Meu perfil 💙" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Tom de pele" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Cabelo", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Salvar meu avatar" })).toBeVisible();
  await page.getByRole("button", { name: "Salvar meu avatar" }).click();
  await expect(page.getByText("Avatar salvo no seu perfil.", { exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
