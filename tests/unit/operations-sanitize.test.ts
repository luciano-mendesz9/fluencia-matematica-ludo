import { describe, expect, it } from "vitest";
import { correlationIdentifier, sanitizeTechnicalMetadata, sanitizeTechnicalText } from "../../src/server/operations/sanitize";

describe("FM-023 sanitização operacional", () => {
  it("remove injeção de linha, URLs sensíveis, e-mail, token e UUID", () => {
    const value = sanitizeTechnicalText("falha\nemail pessoa@example.com postgres://user:pass@host/db https://example.invalid/path?token=abc eyJabc.def.ghi 123e4567-e89b-42d3-a456-426614174000");
    expect(value).not.toMatch(/[\r\n\t]/);
    expect(value).not.toContain("pessoa@example.com");
    expect(value).not.toContain("user:pass");
    expect(value).not.toContain("token=abc");
    expect(value).not.toContain("eyJabc.def.ghi");
    expect(value).not.toContain("123e4567-e89b-42d3-a456-426614174000");
    expect(value).toContain("https://example.invalid/path");
  });

  it("mantém somente metadados técnicos e remove chaves proibidas recursivamente", () => {
    const metadata = sanitizeTechnicalMetadata({
      durationMs: 12,
      route: "https://example.invalid/operacao?password=segredo",
      password: "segredo",
      studentName: "Aluno Privado",
      nested: { authorization: "Bearer segredo", code: "DB_TIMEOUT", answer: "42" },
      "set-cookie": "session=segredo",
    });
    expect(metadata).toEqual({ durationMs: 12, route: "https://example.invalid/operacao", nested: { code: "DB_TIMEOUT" } });
    expect(JSON.stringify(metadata)).not.toMatch(/segredo|Aluno Privado|answer|password|authorization|cookie/i);
  });

  it("aceita correlation ID técnico e substitui entrada hostil", () => {
    expect(correlationIdentifier("fm023.request-01:retry")).toBe("fm023.request-01:retry");
    expect(correlationIdentifier("evento\nforjado")).toMatch(/^[0-9a-f-]{36}$/);
  });
});
