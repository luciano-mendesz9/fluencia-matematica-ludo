import { expect, test, type Page } from "@playwright/test";
import { authFixtures } from "./auth-fixtures";
import { login } from "./auth-helpers";

test.describe.configure({ mode: "serial" });

function schoolCard(page: Page, name: string) {
  return page.getByRole("listitem").filter({ hasText: name });
}

function personCard(page: Page, name: string) {
  return page.getByRole("listitem").filter({ hasText: name }).first();
}

test("coordenador cadastra professor, atribui turma e revoga acesso em 390 px", async ({ browser }) => {
  test.setTimeout(60_000);
  const coordinatorContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await coordinatorContext.newPage();
  await login(page, authFixtures.schools.coordinator.email);
  await schoolCard(page, authFixtures.schools.schoolA.name).getByRole("button", { name: "Acessar escola" }).click();
  await page.goto("/escola/pessoas");
  await page.getByLabel("Nome completo").fill(authFixtures.people.newTeacher.name);
  await page.getByLabel("E-mail institucional").fill(authFixtures.people.newTeacher.email);
  await page.getByLabel("Senha temporária", { exact: true }).fill(authFixtures.people.newTeacher.password);
  await page.getByLabel("Confirmar senha temporária").fill(authFixtures.people.newTeacher.password);
  await page.getByRole("button", { name: "Cadastrar e vincular" }).click();
  await expect(page.getByRole("status")).toHaveText("Conta adulta cadastrada e vinculada.");
  const card = personCard(page, authFixtures.people.newTeacher.name);
  await card.getByLabel(`Turma para ${authFixtures.people.newTeacher.name}`).selectOption({ label: `${authFixtures.people.classA} · 4º ano · ${authFixtures.people.year}` });
  await card.getByRole("button", { name: "Atribuir turma" }).click();
  await expect(card.getByRole("status")).toHaveText("Professor atribuído à turma.");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  const teacherContext = await browser.newContext();
  const teacherPage = await teacherContext.newPage();
  await login(teacherPage, authFixtures.people.newTeacher.email, authFixtures.people.newTeacher.password);
  await schoolCard(teacherPage, authFixtures.schools.schoolA.name).getByRole("button", { name: "Acessar escola" }).click();
  await teacherPage.goto("/professor/turmas");
  await expect(teacherPage.getByRole("heading", { name: authFixtures.people.classA })).toBeVisible();

  await card.getByLabel("Confirmo a suspensão e o encerramento das atribuições ativas.").check();
  await card.getByRole("button", { name: "Suspender vínculo" }).click();
  await expect(card).toContainText("vínculo encerrado");
  await teacherPage.goto("/professor/turmas");
  await expect(teacherPage).toHaveURL(/\/selecionar-escola$/);
  await expect(teacherPage.getByText(authFixtures.schools.schoolA.name)).toHaveCount(0);
  await teacherContext.close();
  await coordinatorContext.close();
});

test("o mesmo professor vê conjuntos separados em duas escolas", async ({ browser }) => {
  const coordinatorContext = await browser.newContext();
  const coordinatorPage = await coordinatorContext.newPage();
  await login(coordinatorPage, authFixtures.schools.coordinator.email);
  await schoolCard(coordinatorPage, authFixtures.schools.schoolA.name).getByRole("button", { name: "Acessar escola" }).click();
  await coordinatorPage.goto("/escola/pessoas");
  const teacherA = personCard(coordinatorPage, authFixtures.schools.multiTeacher.name);
  await teacherA.getByLabel(`Turma para ${authFixtures.schools.multiTeacher.name}`).selectOption({ label: `${authFixtures.people.classA} · 4º ano · ${authFixtures.people.year}` });
  await teacherA.getByRole("button", { name: "Atribuir turma" }).click();
  await expect(teacherA.getByRole("status")).toHaveText("Professor atribuído à turma.");
  await coordinatorContext.close();

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await login(adminPage, authFixtures.recovery.adminEmail);
  await adminPage.goto("/admin/escolas");
  await schoolCard(adminPage, authFixtures.schools.schoolB.name).getByRole("link", { name: "Gerenciar" }).click();
  await adminPage.getByRole("link", { name: "Gerenciar pessoas" }).click();
  const teacherB = personCard(adminPage, authFixtures.schools.multiTeacher.name);
  await teacherB.getByLabel(`Turma para ${authFixtures.schools.multiTeacher.name}`).selectOption({ label: `${authFixtures.people.classB} · 4º ano · ${authFixtures.people.year}` });
  await teacherB.getByRole("button", { name: "Atribuir turma" }).click();
  await expect(teacherB.getByRole("status")).toHaveText("Professor atribuído à turma.");
  await adminContext.close();

  const teacherContext = await browser.newContext();
  const teacherPage = await teacherContext.newPage();
  await login(teacherPage, authFixtures.schools.multiTeacher.email);
  await schoolCard(teacherPage, authFixtures.schools.schoolA.name).getByRole("button", { name: "Acessar escola" }).click();
  await teacherPage.goto("/professor/turmas");
  await expect(teacherPage.getByRole("heading", { name: authFixtures.people.classA })).toBeVisible();
  await expect(teacherPage.getByText(authFixtures.people.classB)).toHaveCount(0);
  await teacherPage.locator('select[name="schoolId"]:visible').selectOption({ label: authFixtures.schools.schoolB.name });
  await teacherPage.getByRole("button", { name: "Trocar" }).click();
  await teacherPage.goto("/professor/turmas");
  await expect(teacherPage.getByRole("heading", { name: authFixtures.people.classB })).toBeVisible();
  await expect(teacherPage.getByText(authFixtures.people.classA)).toHaveCount(0);
  await teacherContext.close();
});

test("SEMED cria e bloqueia conta global; professor não acessa gestão", async ({ browser }) => {
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await login(adminPage, authFixtures.recovery.adminEmail);
  await adminPage.goto("/admin/pessoas");
  await adminPage.getByLabel("Nome completo").fill(authFixtures.people.globalDeveloper.name);
  await adminPage.getByLabel("E-mail institucional").fill(authFixtures.people.globalDeveloper.email);
  await adminPage.getByLabel("Papel global").selectOption("DEVELOPER");
  await adminPage.getByLabel("Senha temporária", { exact: true }).fill(authFixtures.people.globalDeveloper.password);
  await adminPage.getByLabel("Confirmar senha temporária").fill(authFixtures.people.globalDeveloper.password);
  await adminPage.getByRole("button", { name: "Cadastrar conta global" }).click();
  await expect(adminPage.getByRole("status")).toHaveText("Conta global cadastrada.");
  const developerCard = personCard(adminPage, authFixtures.people.globalDeveloper.name);
  await developerCard.getByLabel("Confirmo a revogação imediata das sessões.").check();
  await developerCard.getByRole("button", { name: "Bloquear conta" }).click();
  await expect(developerCard).toContainText("Bloqueado");
  await adminContext.close();

  const teacherContext = await browser.newContext();
  const teacherPage = await teacherContext.newPage();
  await login(teacherPage, authFixtures.schools.multiTeacher.email);
  await schoolCard(teacherPage, authFixtures.schools.schoolA.name).getByRole("button", { name: "Acessar escola" }).click();
  await teacherPage.goto("/escola/pessoas");
  await expect(teacherPage).toHaveURL(/\/professor$/);
  await teacherContext.close();
});
