import { expect, test } from "@playwright/test";
import { authFixtures } from "./auth-fixtures";
import { login } from "./auth-helpers";

test.describe.configure({ mode: "serial" });

test("coordenador cria, edita e inativa ano letivo e turma em 390 px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, authFixtures.schools.coordinator.email);
  await page.getByRole("listitem").filter({ hasText: authFixtures.schools.schoolA.name }).getByRole("button", { name: "Acessar escola" }).click();
  await page.goto("/escola/anos");
  await page.getByLabel("Ano letivo").fill(String(authFixtures.academics.year));
  await page.getByRole("button", { name: "Cadastrar ano" }).click();
  await expect(page.getByRole("status")).toHaveText("Ano letivo cadastrado.");
  await expect(page.getByRole("heading", { name: `Ano letivo ${authFixtures.academics.year}` })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.goto("/escola/turmas");
  await page.getByLabel("Ano letivo").selectOption({ label: String(authFixtures.academics.year) });
  await page.getByLabel("Série").selectOption("3");
  await page.getByLabel("Nome da turma").fill(authFixtures.academics.className);
  await page.getByRole("button", { name: "Cadastrar turma" }).click();
  await expect(page.getByRole("status")).toHaveText("Turma cadastrada.");
  await page.getByRole("listitem").filter({ hasText: authFixtures.academics.className }).getByRole("link", { name: "Ver detalhes" }).click();
  await page.getByLabel("Nome da turma").fill(authFixtures.academics.updatedClassName);
  await page.getByLabel("Situação").selectOption("INACTIVE");
  await page.getByRole("button", { name: "Salvar turma" }).click();
  await expect(page.getByRole("status")).toHaveText("Turma atualizada.");
  await expect(page.getByRole("heading", { name: authFixtures.academics.updatedClassName })).toBeVisible();

  await page.goto("/escola/anos");
  await page.getByRole("listitem").filter({ hasText: String(authFixtures.academics.year) }).getByRole("link", { name: "Ver detalhes" }).click();
  await page.getByLabel("Situação").selectOption("INACTIVE");
  await page.getByRole("button", { name: "Salvar ano letivo" }).click();
  await expect(page.getByRole("status")).toHaveText("Ano letivo atualizado.");
});

test("professor não acessa a gestão e SEMED consulta os cadastros no desktop", async ({ browser }) => {
  const teacherContext = await browser.newContext();
  const teacherPage = await teacherContext.newPage();
  await login(teacherPage, authFixtures.schools.teacherOne.email);
  await teacherPage.getByRole("listitem").filter({ hasText: authFixtures.schools.schoolA.name }).getByRole("button", { name: "Acessar escola" }).click();
  await teacherPage.goto("/escola/anos");
  await expect(teacherPage).toHaveURL(/\/professor$/);
  await teacherContext.close();

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await login(adminPage, authFixtures.recovery.adminEmail);
  await adminPage.goto("/admin/escolas");
  await adminPage.getByRole("listitem").filter({ hasText: authFixtures.schools.schoolA.name }).getByRole("link", { name: "Gerenciar" }).click();
  await adminPage.getByRole("link", { name: "Gerenciar anos letivos" }).click();
  await expect(adminPage.getByRole("heading", { name: `Ano letivo ${authFixtures.academics.year}` })).toBeVisible();
  await adminPage.goto(`/admin/escolas/${adminPage.url().split("/escolas/")[1]?.split("/")[0]}/turmas`);
  await expect(adminPage.getByRole("heading", { name: authFixtures.academics.updatedClassName })).toBeVisible();
  await adminContext.close();
});
