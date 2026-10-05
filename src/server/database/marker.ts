import type { PrismaClient } from "@/src/generated/prisma/client";

export async function assertDatabaseMarker(client: PrismaClient, expectedEnvironmentId: string) {
  const rows = await client.$queryRaw<Array<{ environmentId: string | null }>>`
    SELECT current_setting('app.environment_id', true) AS "environmentId"
  `;
  const actualEnvironmentId = rows[0]?.environmentId;

  if (!actualEnvironmentId) {
    throw new Error("[database] marker app.environment_id ausente no banco; operação recusada.");
  }
  if (actualEnvironmentId !== expectedEnvironmentId) {
    throw new Error("[database] APP_ENV_ID não coincide com o marker do banco; operação recusada.");
  }
}
