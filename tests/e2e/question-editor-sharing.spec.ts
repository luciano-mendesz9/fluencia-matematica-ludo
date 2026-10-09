import { expect, test, type Page } from "@playwright/test";
import { authFixtures } from "./auth-fixtures";
import { login } from "./auth-helpers";

test.describe.configure({ mode: "serial" });

const themeName = "Álgebra FM-011 E2E";
const approvedStatement = "Qual alternativa representa quatro unidades?";
const changesStatement = "Quanto é a metade de cinco?";

async function enterTeacherArea(page: Page) {
  await login(page, authFixtures.schools.teacherOne.email);
  await expect(page).not.toHaveURL(/\/login$/);
  if (/selecionar-escola/.test(page.url())) {
    await page.getByRole("listitem").filter({ hasText: authFixtures.schools.schoolA.name }).getByRole("button", { name: "Acessar escola" }).click();
  }
  await expect(page).toHaveURL(/\/professor$/);
}

async function createNumericQuestion(page: Page) {
  await page.goto("/questoes/nova");
  const form = page.getByRole("heading", { name: "Editor completo de questão" }).locator("xpath=following::form[1]");
  await form.locator('select[name="grade"]').selectOption("1");
  await form.locator('select[name="difficulty"]').selectOption("2");
  await form.locator('select[name="themeId"]').selectOption({ label: themeName });
  await form.getByLabel("Enunciado").fill(changesStatement);
  await form.getByLabel("Tipo de resposta").selectOption("NUMERIC");
  await form.getByLabel("Resposta numérica esperada").fill("2,5");
  await form.getByRole("button", { name: "Cadastrar questão completa" }).click();
  await expect(form.getByRole("status")).toContainText("Questão completa cadastrada.");
  await form.getByRole("link", { name: "Abrir questão criada" }).click();
  await page.getByRole("button", { name: "Enviar esta versão à SEMED" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Versão enviada à SEMED." })).toBeVisible();
}

test("professor edita, testa e envia; SEMED pede ajuste e publica cópia rastreável", async ({ browser }) => {
  test.setTimeout(120_000);

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await login(adminPage, authFixtures.recovery.adminEmail);
  await expect(adminPage).toHaveURL(/\/admin$/);
  await adminPage.goto("/questoes");
  const themeForm = adminPage.getByRole("heading", { name: "Novo tema" }).locator("xpath=..");
  await themeForm.getByLabel("Nome").fill(themeName);
  await themeForm.getByRole("button", { name: "Cadastrar tema" }).click();
  await expect(themeForm.getByRole("status")).toHaveText("Tema cadastrado.");

  const teacherContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await teacherContext.addInitScript(() => {
    class TestUtterance { constructor(public text: string) {} }
    Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: TestUtterance });
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { cancel() {}, speak() {} } });
  });
  const teacherPage = await teacherContext.newPage();
  await enterTeacherArea(teacherPage);
  await teacherPage.goto("/questoes/nova");
  const editor = teacherPage.getByRole("heading", { name: "Editor completo de questão" }).locator("xpath=following::form[1]");
  await editor.locator('select[name="grade"]').selectOption("1");
  await editor.locator('select[name="difficulty"]').selectOption("3");
  await editor.locator('select[name="themeId"]').selectOption({ label: themeName });
  await editor.getByLabel("Enunciado").fill(approvedStatement);
  await editor.getByLabel("Texto da alternativa 1").fill("Quatro");
  await editor.getByLabel("Texto da alternativa 2").fill("Cinco");
  await editor.getByLabel("Explicação após erro").fill("Quatro unidades representam o número 4.");
  await editor.locator('input[name="image"]').setInputFiles({
    name: "quatro-pontos.png",
    mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"),
  });
  await editor.getByLabel("Descrição acessível").fill("Quatro pontos azuis organizados em linha");
  await editor.getByRole("button", { name: "Cadastrar questão completa" }).click();
  await expect(editor.getByRole("status")).toContainText("Questão completa cadastrada.");
  await editor.getByRole("link", { name: "Abrir questão criada" }).click();

  const versionEditor = teacherPage.getByRole("heading", { name: /Criar versão 2/ }).locator("xpath=following::form[1]");
  await versionEditor.getByRole("button", { name: "Mover alternativa 1 para baixo" }).click();
  await expect(versionEditor.locator('input[name="optionText"]').nth(0)).toHaveValue("Cinco");
  await expect(versionEditor.locator('input[name="optionText"]').nth(1)).toHaveValue("Quatro");
  await versionEditor.getByRole("button", { name: "Criar nova versão completa" }).click();
  await expect(teacherPage.getByRole("status").filter({ hasText: "Versão 2 criada com conteúdo completo." })).toBeVisible();

  const preview = teacherPage.locator("section").filter({ has: teacherPage.getByRole("heading", { name: "Prévia fiel da versão 2" }) });
  const wrongAnswer = preview.getByRole("radio").first();
  await wrongAnswer.focus();
  await wrongAnswer.press("Space");
  await expect(wrongAnswer).toBeChecked();
  const statementAudio = preview.getByRole("button", { name: "Ouvir enunciado" });
  await expect(statementAudio).toHaveAttribute("data-audio-version-id", /.+/);
  const versionId = await statementAudio.getAttribute("data-audio-version-id");
  const challengePayload = await teacherPage.evaluate(async (id) => {
    const response = await fetch(`/api/questoes/versoes/${id}/desafio`);
    return { status: response.status, body: await response.text() };
  }, versionId);
  expect(challengePayload.status).toBe(200);
  expect(challengePayload.body).not.toMatch(/isCorrect|numericExpected|correctAnswer|explanation/);
  await statementAudio.click();
  await expect(preview.getByRole("status").filter({ hasText: "Leitura iniciada pela voz do dispositivo." })).toBeVisible();
  await expect(wrongAnswer).toBeChecked();
  await teacherPage.evaluate(() => Object.defineProperty(window.speechSynthesis, "speak", { configurable: true, value: () => { throw new Error("falha sintética"); } }));
  await statementAudio.click();
  await expect(preview.getByRole("status").filter({ hasText: "Falha ao iniciar o áudio; a resposta foi preservada." })).toBeVisible();
  await expect(wrongAnswer).toBeChecked();
  await preview.getByRole("button", { name: "Corrigir prévia" }).click();
  const correction = preview.getByRole("status").filter({ hasText: "Resposta incorreta." });
  await expect(correction).toBeVisible({ timeout: 15_000 });
  await expect(correction).toContainText("Resposta correta: Quatro");
  const overflow = await teacherPage.locator("body *").evaluateAll((elements) => elements
    .map((element) => ({ tag: element.tagName, text: element.textContent?.trim().slice(0, 60), right: Math.ceil(element.getBoundingClientRect().right), width: Math.ceil(element.getBoundingClientRect().width) }))
    .filter((element) => element.right > window.innerWidth + 1));
  expect(overflow).toEqual([]);
  await teacherPage.getByRole("button", { name: "Enviar esta versão à SEMED" }).click();
  await expect(teacherPage.getByRole("status").filter({ hasText: "Versão enviada à SEMED." })).toBeVisible();

  await createNumericQuestion(teacherPage);

  await adminPage.goto("/questoes/revisao");
  let approvedCard = adminPage.getByRole("listitem").filter({ hasText: approvedStatement });
  await approvedCard.getByRole("button", { name: "Iniciar análise" }).click();
  await expect(approvedCard).toContainText("UNDER_REVIEW");
  approvedCard = adminPage.getByRole("listitem").filter({ hasText: approvedStatement });
  await approvedCard.getByLabel("Decisão").selectOption("APPROVED_PUBLISHED");
  await approvedCard.getByLabel("Observação").fill("Aprovada para o banco da rede.");
  await approvedCard.getByRole("button", { name: "Registrar decisão" }).click();
  await expect(approvedCard).toContainText("APPROVED_PUBLISHED");

  const changesCard = adminPage.getByRole("listitem").filter({ hasText: changesStatement });
  await changesCard.getByLabel("Decisão").selectOption("CHANGES_REQUESTED");
  await changesCard.getByLabel("Observação").fill("Detalhar a estratégia de cálculo esperada.");
  await changesCard.getByRole("button", { name: "Registrar decisão" }).click();
  await expect(changesCard).toContainText("CHANGES_REQUESTED");

  await teacherPage.goto("/questoes");
  await expect(teacherPage.getByText(approvedStatement)).toHaveCount(2);
  await adminContext.close();
  await teacherContext.close();
});
