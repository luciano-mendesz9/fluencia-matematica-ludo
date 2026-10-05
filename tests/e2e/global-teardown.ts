import "dotenv/config";
import { createNeonTestPool } from "../helpers/neon-pool";
import { throttleKey } from "../../src/server/auth/crypto";
import { authFixtures } from "./auth-fixtures";

export default async function globalTeardown() {
  const { pool } = createNeonTestPool();
  try {
    await pool.query(
      "DELETE FROM \"User\" WHERE \"normalizedEmail\" = ANY($1::text[]) OR \"studentCode\" = $2",
      [[authFixtures.adult.identifier, authFixtures.blocked.identifier], authFixtures.student.identifier],
    );
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
