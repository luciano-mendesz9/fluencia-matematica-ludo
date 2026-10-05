import type { PrismaClient } from "@/src/generated/prisma/client";

export async function assertDatabaseMarker(client: PrismaClient, expectedEnvironmentId: string) {
  const rows = await client.$queryRaw<Array<{ schemaName: string }>>`
    SELECT schema_name::text AS "schemaName"
    FROM information_schema.schemata
    WHERE schema_name LIKE 'fluencia_environment_%'
    ORDER BY schema_name
  `;
  const expectedMarker = `fluencia_environment_${expectedEnvironmentId.replaceAll("-", "_")}`;

  if (rows.length === 0) {
    throw new Error("[database] marker de ambiente ausente no banco; operação recusada.");
  }
  if (rows.length !== 1 || rows[0]?.schemaName !== expectedMarker) {
    throw new Error("[database] APP_ENV_ID não coincide com o marker do banco; operação recusada.");
  }
}
