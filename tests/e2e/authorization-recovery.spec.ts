import { expect, test } from "@playwright/test";
import { authFixtures } from "./auth-fixtures";
import { login, loginAsStudent } from "./auth-helpers";

test("solicitação adulta mantém resposta neutra para conta conhecida e desconhecida", async ({ page }) => {
  const message = "Se o e-mail estiver cadastrado, as instruções de recuperação serão enviadas.";
  await page.goto("/recuperar-acesso");
  await page.getByLabel("E-mail institucional").fill(authFixtures.recovery.requestEmail);
  await page.getByRole("button", { name: "Solicitar recuperação" }).click();
  await expect(page.getByRole("status")).toHaveText(message);

  await page.getByLabel("E-mail institucional").fill("conta-ausente@example.invalid");
  await page.getByRole("button", { name: "Solicitar recuperação" }).click();
  await expect(page.getByRole("status")).toHaveText(message);
});

test("link adulto é de uso único, altera a senha e permite novo login", async ({ page }) => {
  await page.goto(`/redefinir-senha?token=${authFixtures.recovery.resetToken}`);
  await page.getByLabel("Nova senha", { exact: true }).fill(authFixtures.recovery.newPassword);
  await page.getByLabel("Confirmar nova senha", { exact: true }).fill(authFixtures.recovery.newPassword);
  await page.getByRole("button", { name: "Alterar senha" }).click();
  await expect(page.getByRole("status")).toContainText("Senha alterada");

  await page.goto(`/redefinir-senha?token=${authFixtures.recovery.resetToken}`);
  await page.getByLabel("Nova senha", { exact: true }).fill(authFixtures.recovery.newPassword);
  await page.getByLabel("Confirmar nova senha", { exact: true }).fill(authFixtures.recovery.newPassword);
  await page.getByRole("button", { name: "Alterar senha" }).click();
  await expect(page.locator("p[role=alert]")).toContainText("já foi utilizado");

  await login(page, authFixtures.recovery.resetEmail, authFixtures.recovery.newPassword);
  await expect(page).toHaveURL(/\/selecionar-escola$/);
});

test("SEMED redefine a senha do aluno e a credencial nova funciona", async ({ page, browser }) => {
  await login(page, authFixtures.recovery.adminEmail);
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/redefinir-senha-aluno");
  await page.getByLabel("Código do aluno", { exact: true }).fill(authFixtures.recovery.studentCode.toLowerCase());
  await page.getByLabel("Nova senha temporária", { exact: true }).fill(authFixtures.recovery.studentNewPassword);
  await page.getByLabel("Confirmar nova senha", { exact: true }).fill(authFixtures.recovery.studentNewPassword);
  await page.getByRole("button", { name: "Redefinir senha" }).click();
  await expect(page.getByRole("status")).toContainText("sessões anteriores revogadas");

  const studentContext = await browser.newContext();
  const studentPage = await studentContext.newPage();
  await login(studentPage, authFixtures.recovery.studentCode, authFixtures.recovery.studentNewPassword);
  await expect(studentPage).toHaveURL(/\/aluno$/);
  await studentContext.close();
});

test("aluno não acessa o fluxo administrativo", async ({ page }) => {
  await loginAsStudent(page);
  await expect(page).toHaveURL(/\/aluno$/);
  await page.goto("/admin/redefinir-senha-aluno");
  await expect(page).toHaveURL(/\/aluno$/);
});

test("formulários de recuperação não criam overflow em 320 e 390px", async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/recuperar-acesso");
    await expect(page.getByRole("heading", { name: "Recuperar acesso" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }

  await login(page, authFixtures.recovery.adminEmail);
  await expect(page).toHaveURL(/\/admin$/);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/admin/redefinir-senha-aluno");
    await expect(page.getByRole("heading", { name: "Redefinir senha de aluno" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
