import "dotenv/config";
import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import { assertNeonTestMarker, createNeonTestPool } from "../helpers/neon-pool";
import { throttleKey } from "../../src/server/auth/crypto";
import { authFixtures } from "./auth-fixtures";

export default async function globalSetup() {
  const { pool, environment } = createNeonTestPool();
  try {
    await assertNeonTestMarker(pool, environment.appEnvId);
    const passwordHash = await bcrypt.hash(authFixtures.password, 10);
    await pool.query(`
      INSERT INTO "User" ("id", "name", "email", "normalizedEmail", "passwordHash", "status", "globalRole", "sessionVersion", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $3, $4, 'ACTIVE', 'SEMED_ADMIN', 1, NOW(), NOW())
      ON CONFLICT ("normalizedEmail") DO UPDATE SET
        "name" = EXCLUDED."name", "passwordHash" = EXCLUDED."passwordHash", "status" = 'ACTIVE',
        "globalRole" = 'SEMED_ADMIN', "sessionVersion" = "User"."sessionVersion" + 1, "updatedAt" = NOW()
    `, [randomUUID(), authFixtures.adult.name, authFixtures.adult.identifier, passwordHash]);
    await pool.query(`
      INSERT INTO "User" ("id", "name", "studentCode", "passwordHash", "status", "sessionVersion", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, 'ACTIVE', 1, NOW(), NOW())
      ON CONFLICT ("studentCode") DO UPDATE SET
        "name" = EXCLUDED."name", "passwordHash" = EXCLUDED."passwordHash", "status" = 'ACTIVE',
        "sessionVersion" = "User"."sessionVersion" + 1, "updatedAt" = NOW()
    `, [randomUUID(), authFixtures.student.name, authFixtures.student.identifier, passwordHash]);
    await pool.query(`
      INSERT INTO "User" ("id", "name", "email", "normalizedEmail", "passwordHash", "status", "sessionVersion", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $3, $4, 'BLOCKED', 1, NOW(), NOW())
      ON CONFLICT ("normalizedEmail") DO UPDATE SET
        "name" = EXCLUDED."name", "passwordHash" = EXCLUDED."passwordHash", "status" = 'BLOCKED',
        "sessionVersion" = "User"."sessionVersion" + 1, "updatedAt" = NOW()
    `, [randomUUID(), authFixtures.blocked.name, authFixtures.blocked.identifier, passwordHash]);
    await pool.query("DELETE FROM \"LoginThrottle\" WHERE \"keyHash\" = ANY($1::text[])", [[
      throttleKey("identifier", `adult:${authFixtures.adult.identifier}`),
      throttleKey("identifier", `student:${authFixtures.student.identifier}`),
      throttleKey("identifier", `adult:${authFixtures.blocked.identifier}`),
      throttleKey("identifier", `adult:${authFixtures.invalidIdentifier}`),
      throttleKey("identifier", `adult:${authFixtures.rateIdentifier}`),
      throttleKey("ip", "203.0.113.50"),
      throttleKey("ip", "unknown"),
      throttleKey("ip", "127.0.0.1"),
      throttleKey("ip", "::1"),
    ]]);
  } finally {
    await pool.end();
  }
}
