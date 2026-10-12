import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { authFixtures } from "./auth-fixtures";
import { login } from "./auth-helpers";

async function expectNoSevereAxeViolations(page: Page) {
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const severe = result.violations
    .filter((violation) => violation.impact === "critical" || violation.impact === "serious")
    .map((violation) => ({ id: violation.id, impact: violation.impact, help: violation.help, targets: violation.nodes.map((node) => node.target.join(" ")).slice(0, 5) }));
  expect(severe).toEqual([]);
}

async function expectNoHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) <= window.innerWidth)).toBe(true);
}

async function reachByKeyboard(page: Page, locatorLabel: string) {
  const target = page.getByLabel(locatorLabel);
  for (let step = 0; step < 10 && !(await target.evaluate((element) => element === document.activeElement)); step += 1) {
    await page.keyboard.press("Tab");
  }
  await expect(target).toBeFocused();
}

async function selectSchoolIfNeeded(page: Page, schoolName: string) {
  await page.waitForURL(/\/(?:selecionar-escola|escola|professor)$/);
  if (!/selecionar-escola/.test(page.url())) return;
  await page.getByRole("listitem").filter({ hasText: schoolName }).getByRole("button", { name: "Acessar escola" }).click();
}

test("login em 320 px respeita teclado, zoom textual e reduced motion", async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 320, height: 800 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/login");
  await reachByKeyboard(page, "E-mail ou código do aluno");
  await page.keyboard.type("estudante-teclado");
  await expect(page.getByLabel("E-mail ou código do aluno")).toHaveValue("estudante-teclado");
  await expectNoSevereAxeViolations(page);
  const motion = await page.locator("button").first().evaluate((element) => getComputedStyle(element).transitionDuration);
  expect(motion.split(",").every((duration) => Number.parseFloat(duration) <= 0.01)).toBe(true);
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath(`login-320-reduced-${testInfo.project.name}.png`), fullPage: true });
  await context.close();
});

test("cinco perfis mantêm semântica, reflow e foco do menu em 390 px", async ({ browser }, testInfo) => {
  test.setTimeout(120_000);
  const profiles = [
    { name: "semed", identifier: authFixtures.adult.identifier, route: "/admin", school: null },
    { name: "coordenador", identifier: authFixtures.schools.coordinator.email, route: "/escola", school: authFixtures.schools.schoolA.name },
    { name: "professor", identifier: authFixtures.schools.teacherOne.email, route: "/professor", school: authFixtures.schools.schoolA.name },
    { name: "aluno", identifier: authFixtures.student.identifier, route: "/aluno", school: null },
    { name: "desenvolvedor", identifier: authFixtures.people.accessibilityDeveloper.email, route: "/operacao", school: null },
  ] as const;

  for (const profile of profiles) {
    await test.step(profile.name, async () => {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      await login(page, profile.identifier);
      if (profile.school) await selectSchoolIfNeeded(page, profile.school);
      await expect(page).toHaveURL(new RegExp(`${profile.route}$`));
      await expectNoHorizontalOverflow(page);
      await expectNoSevereAxeViolations(page);
      const heading = page.getByRole("heading", { level: 1 }).first();
      await expect(heading).toBeVisible();
      await heading.evaluate((element) => { element.textContent = "Nome extremamente longo sem espaços ".repeat(8); });
      await expectNoHorizontalOverflow(page);

      if (profile.name !== "aluno") {
        const menu = page.getByRole("button", { name: "Menu" });
        await menu.click();
        const close = page.getByRole("navigation", { name: "Navegação principal" }).getByRole("button", { name: "Fechar menu" });
        await expect(close).toBeFocused();
        await page.keyboard.press("Escape");
        await expect(menu).toBeFocused();
      }
      await page.screenshot({ path: testInfo.outputPath(`${profile.name}-390-${testInfo.project.name}.png`), fullPage: true });
      await context.close();
    });
  }
});
