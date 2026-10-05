import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";
import { readDatabaseEnvironment } from "../../src/server/database/environment";

export function createNeonTestPool() {
  neonConfig.webSocketConstructor = ws;
  const environment = readDatabaseEnvironment();
  return { pool: new Pool({ connectionString: environment.databaseUrl }), environment };
}

export async function assertNeonTestMarker(pool: Pool, appEnvId: string) {
  const expected = `fluencia_environment_${appEnvId.replaceAll("-", "_")}`;
  const result = await pool.query(
    "SELECT schema_name::text AS name FROM information_schema.schemata WHERE schema_name LIKE $1 ORDER BY schema_name",
    ["fluencia_environment_%"],
  );
  if (result.rows.length !== 1 || result.rows[0]?.name !== expected) {
    throw new Error("[e2e] marker do banco não coincide com APP_ENV_ID.");
  }
}
