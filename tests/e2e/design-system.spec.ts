import { expect, test } from "@playwright/test";
import { loginAsAdult, loginAsStudent } from "./auth-helpers";

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
    const menu = page.getByRole("button", { name: "Menu" });
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await menu.click();
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });
}

test("shell desktop apresenta navegação e trilha estruturais", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await loginAsAdult(page);
  await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Trilha de navegação" })).toContainText("Administração");
  await expect(page.getByText("Área preparada, sem dados simulados")).toBeVisible();
});
