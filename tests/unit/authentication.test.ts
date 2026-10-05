import { describe, expect, it } from "vitest";
import { destinationForUser } from "../../src/server/auth/destination";
import { signSessionJwt, verifySessionJwt } from "../../src/server/auth/jwt";
import { normalizeIdentifier } from "../../src/server/auth/normalization";
import { loginSchema } from "../../src/features/auth/schemas";

describe("authentication primitives", () => {
  it("normalizes adult email and student code without mixing identifier kinds", () => {
    expect(normalizeIdentifier("  Pessoa@EXAMPLE.COM ")).toEqual({ kind: "adult", value: "pessoa@example.com" });
    expect(normalizeIdentifier(" fm004-aluno ")).toEqual({ kind: "student", value: "FM004-ALUNO" });
  });

  it("maps only server-derived account data to a destination", () => {
    expect(destinationForUser({ studentCode: "A1", globalRole: null })).toBe("/aluno");
    expect(destinationForUser({ studentCode: null, globalRole: "SEMED_ADMIN" })).toBe("/admin");
    expect(destinationForUser({ studentCode: null, globalRole: "DEVELOPER" })).toBe("/operacao");
    expect(destinationForUser({ studentCode: null, globalRole: null })).toBe("/professor");
  });

  it("signs and verifies JWT claims and rejects a tampered token", async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = await signSessionJwt({
      userId: "0d542808-13c1-4398-ace5-9228d82eaf1d",
      sessionId: "9b9b96fa-73ac-442a-886b-01c84b33a205",
      sessionVersion: 3,
      issuedAt: now,
      expiresAt: now + 60,
    });
    await expect(verifySessionJwt(token)).resolves.toMatchObject({ sessionVersion: 3 });
    const tampered = `${token.slice(0, -2)}aa`;
    await expect(verifySessionJwt(tampered)).resolves.toBeNull();
  });

  it("rejects oversized or malformed login input before database work", () => {
    expect(loginSchema.safeParse({ identifier: "ab", password: "12345678", requestId: crypto.randomUUID() }).success).toBe(false);
    expect(loginSchema.safeParse({ identifier: "a".repeat(321), password: "12345678", requestId: crypto.randomUUID() }).success).toBe(false);
    expect(loginSchema.safeParse({ identifier: "student", password: "x".repeat(129), requestId: "not-a-uuid" }).success).toBe(false);
  });
});
