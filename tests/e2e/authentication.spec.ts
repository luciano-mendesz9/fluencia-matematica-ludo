import { expect, test } from "@playwright/test";
import { SESSION_COOKIE_NAME } from "../../src/server/auth/constants";
import { authFixtures } from "./auth-fixtures";
import { login, loginAsAdult, loginAsStudent } from "./auth-helpers";

test("acesso direto e cookie adulterado retornam ao login", async ({ page, context }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login$/);

  await context.addCookies([{ name: SESSION_COOKIE_NAME, value: "jwt-adulterado", url: "http://127.0.0.1:3100" }]);
  await page.goto("/aluno");
  await expect(page).toHaveURL(/\/login$/);
  expect((await context.cookies()).some((cookie) => cookie.name === SESSION_COOKIE_NAME)).toBe(false);
});

test("adult entra, recebe cookie protegido, sai e não reutiliza a sessão", async ({ page, context }) => {
  await loginAsAdult(page);
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("banner").getByText(authFixtures.adult.name)).toBeVisible();

  const cookie = (await context.cookies()).find((item) => item.name === SESSION_COOKIE_NAME);
  expect(cookie).toMatchObject({ httpOnly: true, sameSite: "Lax" });
  expect(cookie?.value).toBeTruthy();

  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await context.addCookies([{ name: SESSION_COOKIE_NAME, value: cookie!.value, url: "http://127.0.0.1:3100" }]);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login$/);
});

test("aluno entra com código normalizado e chega apenas à sua área", async ({ page }) => {
  await loginAsStudent(page);
  await expect(page).toHaveURL(/\/aluno$/);
  await expect(page.getByRole("banner").getByText(authFixtures.student.name)).toBeVisible();
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/aluno$/);
});

test("credencial inexistente e conta bloqueada recebem a mesma mensagem", async ({ page }) => {
  await login(page, authFixtures.invalidIdentifier);
  const genericMessage = "Não foi possível entrar. Verifique os dados e tente novamente.";
  await expect(page.locator("p[role=alert]")).toHaveText(genericMessage);

  await page.goto("/login");
  await login(page, authFixtures.blocked.identifier);
  await expect(page.locator("p[role=alert]")).toHaveText(genericMessage);
});

test("tentativas repetidas exibem o estado de rate limit", async ({ page, context }) => {
  await context.setExtraHTTPHeaders({ "x-forwarded-for": "203.0.113.50" });
  await page.goto("/login");

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    await expect(page.getByRole("button", { name: "Entrar" })).toBeEnabled();
    await page.getByLabel("E-mail ou código do aluno").fill(authFixtures.rateIdentifier);
    await page.getByLabel("Senha").fill("senha-incorreta");
    const actionRequest = page.waitForRequest((request) => request.method() === "POST");
    await page.getByRole("button", { name: "Entrar" }).click();
    await (await actionRequest).response();
    await expect(page.getByRole("button", { name: "Entrar" })).toBeEnabled();
  }
  await expect(page.locator("p[role=alert]")).toHaveText("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
});
