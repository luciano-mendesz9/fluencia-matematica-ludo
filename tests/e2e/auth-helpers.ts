import { randomUUID } from "node:crypto";
import type { Page } from "@playwright/test";
import { authFixtures } from "./auth-fixtures";

export async function login(page: Page, identifier: string, password: string = authFixtures.password) {
  const id = randomUUID().replaceAll("-", "");
  const thirdOctet = Number.parseInt(id.slice(0, 2), 16);
  const fourthOctet = Number.parseInt(id.slice(2, 4), 16);
  await page.context().setExtraHTTPHeaders({ "x-forwarded-for": `198.51.${thirdOctet}.${fourthOctet}` });
  await page.goto("/login");
  await page.getByLabel("E-mail ou código do aluno").fill(identifier);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

export function loginAsAdult(page: Page) {
  return login(page, authFixtures.adult.identifier);
}

export function loginAsStudent(page: Page) {
  return login(page, authFixtures.student.identifier.toLowerCase());
}
