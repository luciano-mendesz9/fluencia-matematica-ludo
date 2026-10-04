import { describe, expect, it } from "vitest";

describe("bootstrap", () => {
  it("executa testes TypeScript determinísticos", () => {
    expect(10 - 3 * 2).toBe(4);
  });
});
