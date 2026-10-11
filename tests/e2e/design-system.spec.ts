import { expect, test } from "@playwright/test";
import { loginAsAdult, loginAsStudent } from "./auth-helpers";

test("login orienta o preenchimento e permite mostrar ou ocultar a senha", async ({ page }) => {
  await page.goto("/login");
  const identifier = page.getByLabel("E-mail ou código do aluno");
  const password = page.getByLabel("Senha", { exact: true });
  await expect(identifier).toHaveAttribute("placeholder", "nome@educacao.gov.br ou código do aluno");
  await expect(password).toHaveAttribute("placeholder", "Digite sua senha");
  await password.fill("senha-segura");
  await page.getByRole("button", { name: "Mostrar senha" }).click();
  await expect(password).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Ocultar senha" }).click();
  await expect(password).toHaveAttribute("type", "password");
});

test("modal recebe foco, fecha por teclado e devolve o foco", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Conheça o projeto" });
  await trigger.focus();
  await trigger.press("Enter");

  const dialog = page.getByRole("dialog", { name: "Prática com evidência pedagógica" });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("button", { name: "Fechar" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

for (const width of [320, 390]) {
  test(`shell móvel funciona sem overflow em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 760 });
    await loginAsStudent(page);
    await expect(page.getByRole("heading", { name: "Área do aluno" })).toBeVisible();
    const navigation = page.getByRole("navigation", { name: "Navegação principal" });
    await expect(navigation).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Início" })).toHaveAttribute("aria-current", "page");
    await expect(navigation.getByRole("link", { name: "Atividades" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });
}

test("shell desktop apresenta navegação e trilha estruturais", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await loginAsAdult(page);
  await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Trilha de navegação" })).toContainText("Administração");
  await expect(page.getByRole("heading", { name: "Acessos da sua área" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Escolas/ }).first()).toBeVisible();
});
