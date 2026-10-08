import { expect, test } from "@playwright/test";
import { authFixtures } from "./auth-fixtures";
import { login } from "./auth-helpers";

test.describe.configure({ mode: "serial" });

let studentCode = "";

test("coordenador cadastra aluno e recebe o código somente na criação em 390 px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, authFixtures.schools.coordinator.email);
  await page.getByRole("listitem").filter({ hasText: authFixtures.schools.schoolA.name }).getByRole("button", { name: "Acessar escola" }).click();

  await page.goto("/escola/anos");
  await page.getByLabel("Ano letivo").fill(String(authFixtures.students.year));
  await page.getByRole("button", { name: "Cadastrar ano" }).click();
  await expect(page.getByRole("status")).toHaveText("Ano letivo cadastrado.");

  for (const className of [authFixtures.students.classA, authFixtures.students.classB]) {
    await page.goto("/escola/turmas");
    await page.getByLabel("Ano letivo").selectOption({ label: String(authFixtures.students.year) });
    await page.getByLabel("Série").selectOption("3");
    await page.getByLabel("Nome da turma").fill(className);
    await page.getByRole("button", { name: "Cadastrar turma" }).click();
    await expect(page.getByRole("status")).toHaveText("Turma cadastrada.");
  }

  await page.goto("/escola/alunos/novo");
  await page.getByLabel("Nome do aluno").fill(authFixtures.students.name);
  await page.getByLabel("Turma").selectOption({ label: `${authFixtures.students.classA} · 3º ano · ${authFixtures.students.year}` });
  await page.getByLabel("Senha temporária", { exact: true }).fill(authFixtures.students.temporaryPassword);
  await page.getByLabel("Confirmar senha temporária").fill(authFixtures.students.temporaryPassword);
  await page.getByRole("button", { name: "Cadastrar aluno" }).click();
  await expect(page.getByRole("status")).toContainText("Aluno cadastrado e matriculado.");
  studentCode = await page.getByLabel("Código de acesso do aluno").textContent() ?? "";
  expect(studentCode).toMatch(/^AL-[0-9A-F]{16}$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.goto("/escola/alunos");
  const studentCard = page.getByRole("listitem").filter({ hasText: authFixtures.students.name });
  await expect(studentCard).toContainText(authFixtures.students.classA);
  await expect(studentCard).not.toContainText(studentCode);
});

test("aluno entra com o código e a transferência preserva o histórico", async ({ browser }) => {
  const studentContext = await browser.newContext();
  const studentPage = await studentContext.newPage();
  await login(studentPage, studentCode.toLowerCase(), authFixtures.students.temporaryPassword);
  await expect(studentPage).toHaveURL(/\/aluno$/);
  await expect(studentPage.getByText(authFixtures.students.name)).toBeVisible();
  await studentContext.close();

  const coordinatorContext = await browser.newContext();
  const page = await coordinatorContext.newPage();
  await login(page, authFixtures.schools.coordinator.email);
  await page.getByRole("listitem").filter({ hasText: authFixtures.schools.schoolA.name }).getByRole("button", { name: "Acessar escola" }).click();
  await page.goto("/escola/alunos");
  await page.getByRole("listitem").filter({ hasText: authFixtures.students.name }).getByRole("link", { name: "Ver aluno" }).click();
  await page.getByLabel("Turma").selectOption({ label: `${authFixtures.students.classB} · 3º ano · ${authFixtures.students.year}` });
  await page.getByRole("button", { name: "Transferir aluno" }).click();
  await expect(page.getByRole("status")).toContainText("Transferência concluída.");
  await expect(page.getByRole("heading", { name: authFixtures.students.classA })).toBeVisible();
  await expect(page.getByRole("heading", { name: authFixtures.students.classB })).toBeVisible();
  await expect(page.getByText("Encerrada", { exact: false })).toBeVisible();
  await expect(page.getByText("Ativa", { exact: false })).toBeVisible();
  await coordinatorContext.close();
});

test("redefinição revoga a senha anterior e SEMED consulta sem expor o código", async ({ browser }) => {
  const coordinatorContext = await browser.newContext();
  const page = await coordinatorContext.newPage();
  await login(page, authFixtures.schools.coordinator.email);
  await page.getByRole("listitem").filter({ hasText: authFixtures.schools.schoolA.name }).getByRole("button", { name: "Acessar escola" }).click();
  await page.goto("/escola/alunos");
  await page.getByRole("listitem").filter({ hasText: authFixtures.students.name }).getByRole("link", { name: "Ver aluno" }).click();
  await page.getByLabel("Nova senha", { exact: true }).fill(authFixtures.students.newPassword);
  await page.getByLabel("Confirmar nova senha").fill(authFixtures.students.newPassword);
  await page.getByRole("button", { name: "Redefinir senha" }).click();
  await expect(page.getByRole("status")).toContainText("Senha redefinida");
  await coordinatorContext.close();

  const studentContext = await browser.newContext();
  const studentPage = await studentContext.newPage();
  await login(studentPage, studentCode, authFixtures.students.newPassword);
  await expect(studentPage).toHaveURL(/\/aluno$/);
  await studentContext.close();

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await login(adminPage, authFixtures.recovery.adminEmail);
  await adminPage.goto("/admin/escolas");
  await adminPage.getByRole("listitem").filter({ hasText: authFixtures.schools.schoolA.name }).getByRole("link", { name: "Gerenciar" }).click();
  await adminPage.getByRole("link", { name: "Gerenciar alunos" }).click();
  const studentCard = adminPage.getByRole("listitem").filter({ hasText: authFixtures.students.name });
  await expect(studentCard).toBeVisible();
  await expect(studentCard).not.toContainText(studentCode);
  await adminContext.close();
});

test("professor não acessa a gestão de alunos", async ({ page }) => {
  await login(page, authFixtures.schools.teacherOne.email);
  await page.getByRole("listitem").filter({ hasText: authFixtures.schools.schoolA.name }).getByRole("button", { name: "Acessar escola" }).click();
  await page.goto("/escola/alunos");
  await expect(page).toHaveURL(/\/professor$/);
  await expect(page.getByRole("heading", { name: "Alunos" })).toHaveCount(0);
});
