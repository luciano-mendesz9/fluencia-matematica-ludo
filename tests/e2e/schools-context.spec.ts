import { expect, test, type Page } from "@playwright/test";
import { SCHOOL_CONTEXT_COOKIE_NAME } from "../../src/server/auth/constants";
import { authFixtures } from "./auth-fixtures";
import { login } from "./auth-helpers";

test.describe.configure({ mode: "serial" });

function schoolCard(page: Page, name: string) {
  return page.getByRole("listitem").filter({ hasText: name });
}

test("SEMED cadastra escola, cria vínculo individual e o professor acessa o contexto", async ({ page }) => {
  await login(page, authFixtures.recovery.adminEmail);
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/escolas");
  await page.getByLabel("Nome da escola").fill(authFixtures.schools.created.name);
  await page.getByLabel("Código externo").fill(authFixtures.schools.created.code);
  await page.getByRole("button", { name: "Cadastrar escola" }).click();
  await expect(page.locator("p[role=status]")).toHaveText("Escola cadastrada.");

  const createdCard = schoolCard(page, authFixtures.schools.created.name);
  await expect(createdCard).toBeVisible();
  await createdCard.getByRole("link", { name: "Gerenciar" }).click();
  await page.getByRole("link", { name: "Gerenciar pessoas" }).click();
  await page.getByLabel("E-mail da conta existente", { exact: true }).fill(authFixtures.schools.linkCandidate.email);
  await page.getByRole("button", { name: "Vincular conta existente" }).click();
  await expect(page.locator("p[role=status]")).toHaveText("Conta existente vinculada à escola.");

  await page.getByRole("button", { name: "Sair" }).click();
  await login(page, authFixtures.schools.linkCandidate.email);
  await expect(page).toHaveURL(/\/selecionar-escola$/);
  await schoolCard(page, authFixtures.schools.created.name).getByRole("button", { name: "Acessar escola" }).click();
  await expect(page).toHaveURL(/\/professor$/);
  await expect(page.getByRole("heading", { name: `Área do professor — ${authFixtures.schools.created.name}` })).toBeVisible();
});

test("professor alterna escolas e recupera a preferência local após novo login", async ({ page, context }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await login(page, authFixtures.schools.teacherOne.email);
  await expect(page).toHaveURL(/\/selecionar-escola$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await schoolCard(page, authFixtures.schools.schoolA.name).getByRole("button", { name: "Acessar escola" }).click();
  await expect(page.getByRole("heading", { name: `Área do professor — ${authFixtures.schools.schoolA.name}` })).toBeVisible();

  await page.locator('select[name="schoolId"]:visible').selectOption({ label: authFixtures.schools.schoolB.name });
  await page.locator('button:visible', { hasText: "Trocar" }).click();
  await expect(page.getByRole("heading", { name: `Área do professor — ${authFixtures.schools.schoolB.name}` })).toBeVisible();
  const storedPreference = await page.evaluate(() => Object.entries(localStorage).find(([key]) => key.startsWith("school:"))?.[1]);
  expect(storedPreference).toBeTruthy();

  await page.getByRole("button", { name: "Sair" }).click();
  await context.clearCookies();
  await login(page, authFixtures.schools.teacherOne.email);
  await expect(page.getByRole("heading", { name: `Área do professor — ${authFixtures.schools.schoolB.name}` })).toBeVisible();
});

test("preferência e cookie de outra conta não elevam o contexto", async ({ page }) => {
  await login(page, authFixtures.schools.teacherOne.email);
  await schoolCard(page, authFixtures.schools.schoolA.name).getByRole("button", { name: "Acessar escola" }).click();
  await expect(page).toHaveURL(/\/professor$/);
  await page.getByRole("button", { name: "Sair" }).click();

  await login(page, authFixtures.schools.teacherTwo.email);
  await expect(page).toHaveURL(/\/selecionar-escola$/);
  await expect(page.getByText(authFixtures.schools.schoolA.name)).toHaveCount(0);
  await expect(page.getByText(authFixtures.schools.schoolC.name)).toBeVisible();
  await schoolCard(page, authFixtures.schools.schoolC.name).getByRole("button", { name: "Acessar escola" }).click();
  await expect(page.getByRole("heading", { name: `Área do professor — ${authFixtures.schools.schoolC.name}` })).toBeVisible();
});

test("cookie adulterado e acesso direto não substituem vínculo válido", async ({ page, context }) => {
  await context.addCookies([{ name: SCHOOL_CONTEXT_COOKIE_NAME, value: "contexto-adulterado", url: "http://127.0.0.1:3100" }]);
  await login(page, authFixtures.schools.teacherOne.email);
  await expect(page).toHaveURL(/\/selecionar-escola$/);
  await page.goto("/professor");
  await expect(page).toHaveURL(/\/selecionar-escola$/);
});

test("conta sem vínculo vê estado vazio e coordenador entra somente em sua escola", async ({ page }) => {
  await login(page, authFixtures.schools.noMembership.email);
  await expect(page).toHaveURL(/\/selecionar-escola$/);
  await expect(page.getByText("Nenhuma escola ativa está vinculada à sua conta.")).toBeVisible();
  await page.getByRole("button", { name: "Sair" }).click();

  await login(page, authFixtures.schools.coordinator.email);
  await schoolCard(page, authFixtures.schools.schoolA.name).getByRole("button", { name: "Acessar escola" }).click();
  await expect(page).toHaveURL(/\/escola$/);
  await expect(page.getByRole("heading", { name: `Coordenação — ${authFixtures.schools.schoolA.name}` })).toBeVisible();
});

test("revogação passa a valer no próximo request e remove a escola disponível", async ({ browser }) => {
  test.setTimeout(45_000);
  const teacherContext = await browser.newContext();
  const teacherPage = await teacherContext.newPage();
  await login(teacherPage, authFixtures.schools.teacherOne.email);
  await schoolCard(teacherPage, authFixtures.schools.schoolB.name).getByRole("button", { name: "Acessar escola" }).click();
  await expect(teacherPage).toHaveURL(/\/professor$/);

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await login(adminPage, authFixtures.recovery.adminEmail);
  await expect(adminPage).toHaveURL(/\/admin$/);
  await adminPage.goto("/admin/escolas");
  await schoolCard(adminPage, authFixtures.schools.schoolB.name).getByRole("link", { name: "Gerenciar" }).click();
  await adminPage.getByRole("link", { name: "Gerenciar pessoas" }).click();
  const teacherMembership = adminPage.getByRole("listitem").filter({ hasText: authFixtures.schools.teacherOne.name });
  await teacherMembership.getByLabel("Confirmo a suspensão e o encerramento das atribuições ativas.").check();
  await teacherMembership.getByRole("button", { name: "Suspender vínculo" }).click();
  await expect(adminPage.getByRole("listitem").filter({ hasText: authFixtures.schools.teacherOne.name })).toContainText("vínculo encerrado");

  await teacherPage.goto("/professor");
  await expect(teacherPage).toHaveURL(/\/selecionar-escola$/);
  await expect(teacherPage.getByText(authFixtures.schools.schoolB.name)).toHaveCount(0);
  await expect(teacherPage.getByText(authFixtures.schools.schoolA.name)).toBeVisible();
  await teacherContext.close();
  await adminContext.close();
});
