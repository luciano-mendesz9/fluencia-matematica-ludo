import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { throttleKey } from "../../src/server/auth/crypto";
import { hashPassword, verifyPassword } from "../../src/server/auth/password";
import {
  consumeReset,
  requestAdultReset,
  resetStudentPassword,
  revokeUserSessions,
} from "../../src/server/auth/password-reset";
import type { AdultPasswordResetMessage } from "../../src/server/auth/reset-delivery";
import { isRateLimited, recordRateLimitHit } from "../../src/server/auth/rate-limit";
import { createSession, validateSessionToken } from "../../src/server/auth/session";
import { readDatabaseEnvironment } from "../../src/server/database/environment";
import { assertDatabaseMarker } from "../../src/server/database/marker";

const suffix = randomUUID();
const oldPassword = "Senha-Antiga-2026";
const newPassword = "Senha-Nova-2026";
const adultEmail = `fm005-adult-${suffix}@example.invalid`;
const studentCode = `FM005-${suffix}`.toUpperCase();
const userIds: string[] = [];
const targetIds: string[] = [];
const resetThrottleKey = throttleKey("reset-identifier", adultEmail);
let admin: Awaited<ReturnType<typeof prisma.user.create>>;
let developer: Awaited<ReturnType<typeof prisma.user.create>>;
let adult: Awaited<ReturnType<typeof prisma.user.create>>;
let student: Awaited<ReturnType<typeof prisma.user.create>>;

function principal(user: typeof admin) {
  return { id: user.id, name: user.name, globalRole: user.globalRole, studentCode: user.studentCode };
}

describe.sequential("authorization and recovery against PostgreSQL", () => {
  beforeAll(async () => {
    await assertDatabaseMarker(prisma, readDatabaseEnvironment().appEnvId);
    const passwordHash = await hashPassword(oldPassword);
    [admin, developer, adult, student] = await Promise.all([
      prisma.user.create({ data: { name: "FM005 Admin", email: `fm005-admin-${suffix}@example.invalid`, normalizedEmail: `fm005-admin-${suffix}@example.invalid`, passwordHash, globalRole: "SEMED_ADMIN" } }),
      prisma.user.create({ data: { name: "FM005 Developer", email: `fm005-dev-${suffix}@example.invalid`, normalizedEmail: `fm005-dev-${suffix}@example.invalid`, passwordHash, globalRole: "DEVELOPER" } }),
      prisma.user.create({ data: { name: "FM005 Adult", email: adultEmail, normalizedEmail: adultEmail, passwordHash } }),
      prisma.user.create({ data: { name: "FM005 Student", studentCode, passwordHash } }),
    ]);
    userIds.push(admin.id, developer.id, adult.id, student.id);
    targetIds.push(...userIds);
  });

  afterAll(async () => {
    await prisma.passwordReset.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.auditEvent.deleteMany({ where: { targetId: { in: targetIds } } });
    await prisma.loginThrottle.deleteMany({ where: { keyHash: resetThrottleKey } });
    await prisma.$disconnect();
  });

  it("keeps reset requests neutral and sends a raw token only to the delivery adapter", async () => {
    const captured: AdultPasswordResetMessage[] = [];
    const delivery = { async send(message: AdultPasswordResetMessage) { captured.push(message); } };
    await expect(requestAdultReset({ email: adultEmail.toUpperCase(), delivery })).resolves.toEqual({ accepted: true });
    await expect(requestAdultReset({ email: `missing-${suffix}@example.invalid`, delivery })).resolves.toEqual({ accepted: true });

    expect(captured).toHaveLength(1);
    expect(captured[0]?.recipient).toBe(adultEmail);
    const stored = await prisma.passwordReset.findFirst({ where: { userId: adult.id }, orderBy: { createdAt: "desc" } });
    expect(stored?.tokenHash).not.toBe(captured[0]?.token);
    expect(stored?.tokenHash).toHaveLength(64);
  });

  it("allows one concurrent token consumer, changes the password and revokes the old session", async () => {
    const captured: AdultPasswordResetMessage[] = [];
    await requestAdultReset({ email: adultEmail, delivery: { async send(message) { captured.push(message); } } });
    const session = await createSession(adult, randomUUID());
    const token = captured[0]!.token;
    const results = await Promise.all([
      consumeReset({ token, newPassword }),
      consumeReset({ token, newPassword }),
    ]);

    expect(results.filter((result) => result.ok)).toHaveLength(1);
    await expect(validateSessionToken(session.token)).resolves.toBeNull();
    const changed = await prisma.user.findUniqueOrThrow({ where: { id: adult.id } });
    await expect(verifyPassword(newPassword, changed.passwordHash)).resolves.toBe(true);
    await expect(verifyPassword(oldPassword, changed.passwordHash)).resolves.toBe(false);
    await expect(consumeReset({ token, newPassword })).resolves.toEqual({ ok: false });
  });

  it("rate limits reset requests through hashed shared state", async () => {
    await prisma.loginThrottle.deleteMany({ where: { keyHash: resetThrottleKey } });
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      await expect(recordRateLimitHit([resetThrottleKey])).resolves.toBe(false);
    }
    await expect(recordRateLimitHit([resetThrottleKey])).resolves.toBe(true);
    await expect(isRateLimited([resetThrottleKey])).resolves.toBe(true);
  });

  it("fails closed for an unauthorized student reset and permits SEMED", async () => {
    await expect(resetStudentPassword({ actor: principal(developer), studentId: student.id, newPassword }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });

    const oldSession = await createSession(student, randomUUID());
    await expect(resetStudentPassword({ actor: principal(admin), studentId: student.id, newPassword }))
      .resolves.toEqual({ ok: true });
    await expect(validateSessionToken(oldSession.token)).resolves.toBeNull();
    const changed = await prisma.user.findUniqueOrThrow({ where: { id: student.id } });
    await expect(verifyPassword(newPassword, changed.passwordHash)).resolves.toBe(true);
  });

  it("accepts coordinator authorization only through the scoped resolver", async () => {
    const coordinator = { ...principal(developer), globalRole: null };
    await expect(resetStudentPassword({
      actor: coordinator,
      studentId: student.id,
      newPassword: "Senha-Coordenador-2026",
      authorizeCoordinator: async ({ actorId, studentId }) => actorId === coordinator.id && studentId === student.id
        ? { schoolId: randomUUID(), role: "COORDINATOR" }
        : null,
    })).resolves.toEqual({ ok: true });
  });

  it("revokes own sessions but denies a developer revoking another account", async () => {
    const ownSession = await createSession(developer, randomUUID());
    await expect(revokeUserSessions({ actor: principal(developer), targetUserId: adult.id }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
    const result = await revokeUserSessions({ actor: principal(developer), targetUserId: developer.id });
    expect(result.revokedSessions).toBeGreaterThanOrEqual(1);
    await expect(validateSessionToken(ownSession.token)).resolves.toBeNull();
  });
});
