import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { authenticate } from "../../src/server/auth/authenticate";
import { throttleKey } from "../../src/server/auth/crypto";
import { hashPassword } from "../../src/server/auth/password";
import { validateSessionToken } from "../../src/server/auth/session";
import { readDatabaseEnvironment } from "../../src/server/database/environment";
import { assertDatabaseMarker } from "../../src/server/database/marker";

const password = "FM004-Teste!2026";
const suffix = randomUUID();
const adultEmail = `fm004-adult-${suffix}@example.invalid`;
const blockedEmail = `fm004-blocked-${suffix}@example.invalid`;
const studentCode = `FM004-${suffix}`.toUpperCase();
const userIds: string[] = [];
const throttleKeys = new Set<string>();

function rememberThrottle(identifier: string, kind: "adult" | "student", ipAddress: string) {
  throttleKeys.add(throttleKey("identifier", `${kind}:${identifier}`));
  throttleKeys.add(throttleKey("ip", ipAddress));
}

describe.sequential("authentication against PostgreSQL", () => {
  beforeAll(async () => {
    await assertDatabaseMarker(prisma, readDatabaseEnvironment().appEnvId);
    const passwordHash = await hashPassword(password);
    const users = await Promise.all([
      prisma.user.create({ data: { name: "FM004 Adult", email: adultEmail, normalizedEmail: adultEmail, passwordHash, globalRole: "SEMED_ADMIN" } }),
      prisma.user.create({ data: { name: "FM004 Student", studentCode, passwordHash } }),
      prisma.user.create({ data: { name: "FM004 Blocked", email: blockedEmail, normalizedEmail: blockedEmail, passwordHash, status: "BLOCKED" } }),
    ]);
    userIds.push(...users.map((user) => user.id));
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.loginThrottle.deleteMany({ where: { keyHash: { in: [...throttleKeys] } } });
    await prisma.$disconnect();
  });

  it("authenticates an adult, persists one idempotent session and rejects replay after revocation", async () => {
    const requestId = randomUUID();
    const ipAddress = "198.51.100.10";
    rememberThrottle(adultEmail, "adult", ipAddress);
    const first = await authenticate({ identifier: adultEmail.toUpperCase(), password, requestId, ipAddress });
    const second = await authenticate({ identifier: adultEmail, password, requestId, ipAddress });

    expect(first).toMatchObject({ ok: true, redirect: "/admin" });
    expect(second).toMatchObject({ ok: true, redirect: "/admin" });
    if (!first.ok || !second.ok) throw new Error("expected successful authentication");
    expect(second.token).toBe(first.token);
    await expect(prisma.session.count({ where: { requestId } })).resolves.toBe(1);
    const principal = await validateSessionToken(first.token);
    expect(principal?.user.email).toBe(adultEmail);

    await prisma.session.update({ where: { id: principal?.sessionId }, data: { revokedAt: new Date() } });
    await expect(validateSessionToken(first.token)).resolves.toBeNull();
  });

  it("authenticates a student by canonical code", async () => {
    const ipAddress = "198.51.100.11";
    rememberThrottle(studentCode, "student", ipAddress);
    const result = await authenticate({ identifier: studentCode.toLowerCase(), password, requestId: randomUUID(), ipAddress });
    expect(result).toMatchObject({ ok: true, redirect: "/aluno" });
  });

  it("does not distinguish an unknown account from a blocked account", async () => {
    const unknown = `missing-${suffix}@example.invalid`;
    const unknownIp = "198.51.100.12";
    const blockedIp = "198.51.100.13";
    rememberThrottle(unknown, "adult", unknownIp);
    rememberThrottle(blockedEmail, "adult", blockedIp);

    const unknownResult = await authenticate({ identifier: unknown, password, requestId: randomUUID(), ipAddress: unknownIp });
    const blockedResult = await authenticate({ identifier: blockedEmail, password, requestId: randomUUID(), ipAddress: blockedIp });
    expect(unknownResult).toEqual({ ok: false, reason: "INVALID_CREDENTIALS" });
    expect(blockedResult).toEqual(unknownResult);
  });

  it("rate limits repeated failures using hashed shared state", async () => {
    const identifier = `rate-${suffix}@example.invalid`;
    const ipAddress = "198.51.100.14";
    rememberThrottle(identifier, "adult", ipAddress);

    for (let attempt = 1; attempt <= 4; attempt += 1) {
      await expect(authenticate({ identifier, password: "wrong-password", requestId: randomUUID(), ipAddress }))
        .resolves.toEqual({ ok: false, reason: "INVALID_CREDENTIALS" });
    }
    await expect(authenticate({ identifier, password: "wrong-password", requestId: randomUUID(), ipAddress }))
      .resolves.toEqual({ ok: false, reason: "RATE_LIMITED" });
    await expect(authenticate({ identifier, password, requestId: randomUUID(), ipAddress }))
      .resolves.toEqual({ ok: false, reason: "RATE_LIMITED" });
  });
});
