import { expect, test } from "@playwright/test";

test("abre a página inicial da Fluência Matemática", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: "Fluência Matemática" }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText("base técnica");
});
