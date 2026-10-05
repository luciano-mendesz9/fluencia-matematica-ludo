import type { Page } from "@playwright/test";
import { authFixtures } from "./auth-fixtures";

export async function login(page: Page, identifier: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail ou código do aluno").fill(identifier);
  await page.getByLabel("Senha").fill(authFixtures.password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

export function loginAsAdult(page: Page) {
  return login(page, authFixtures.adult.identifier);
}

export function loginAsStudent(page: Page) {
  return login(page, authFixtures.student.identifier.toLowerCase());
}
