import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { readDatabaseEnvironment } from "../../src/server/database/environment";
import { assertDatabaseMarker } from "../../src/server/database/marker";

const environment = readDatabaseEnvironment();

describe.sequential("PostgreSQL foundation", () => {
  beforeAll(async () => {
    await assertDatabaseMarker(prisma, environment.appEnvId);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("enforces canonical identity uniqueness and rolls the failed transaction back", async () => {
    const suffix = randomUUID();
    const normalizedEmail = `fm003-${suffix}@example.invalid`;

    await expect(prisma.$transaction(async (transaction) => {
      await transaction.user.create({
        data: {
          name: "FM-003 integration user",
          email: normalizedEmail,
          normalizedEmail,
          studentCode: `FM003-${suffix}`,
          passwordHash: "integration-test-hash",
        },
      });
      await transaction.user.create({
        data: {
          name: "FM-003 duplicate user",
          email: normalizedEmail,
          normalizedEmail,
          passwordHash: "integration-test-hash",
        },
      });
    })).rejects.toMatchObject({ code: "P2002" });

    await expect(prisma.user.count({ where: { normalizedEmail } })).resolves.toBe(0);
  });

  it("enforces session token uniqueness without persisting the test user", async () => {
    const suffix = randomUUID();
    const studentCode = `FM003-${suffix}`;
    const tokenHash = `token-${suffix}`;

    await expect(prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          name: "FM-003 session user",
          studentCode,
          passwordHash: "integration-test-hash",
        },
      });
      const session = {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60_000),
      };
      await transaction.session.create({ data: { ...session, requestId: randomUUID() } });
      await transaction.session.create({ data: { ...session, requestId: randomUUID() } });
    })).rejects.toMatchObject({ code: "P2002" });

    await expect(prisma.user.count({ where: { studentCode } })).resolves.toBe(0);
    await expect(prisma.session.count({ where: { tokenHash } })).resolves.toBe(0);
  });

  it("rolls an explicit audit transaction back", async () => {
    const correlationId = `fm003-${randomUUID()}`;

    await expect(prisma.$transaction(async (transaction) => {
      await transaction.auditEvent.create({
        data: {
          action: "FM003_ROLLBACK_PROBE",
          targetType: "DatabaseFoundation",
          correlationId,
        },
      });
      throw new Error("FM003_EXPECTED_ROLLBACK");
    })).rejects.toThrow("FM003_EXPECTED_ROLLBACK");

    await expect(prisma.auditEvent.count({ where: { correlationId } })).resolves.toBe(0);
  });
});
