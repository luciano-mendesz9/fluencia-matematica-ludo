import "dotenv/config";

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { spawnSync } from "node:child_process";
import path from "node:path";
import ws from "ws";
import { PrismaClient } from "../src/generated/prisma/client";
import { assertDatabaseEnvironmentConfiguration } from "../src/server/database/environment";
import { assertDatabaseMarker } from "../src/server/database/marker";

async function main() {
  const args = process.argv.slice(2);
  const allowedCommands = new Set(["migrate dev", "migrate deploy", "migrate status"]);
  const command = args.slice(0, 2).join(" ");

  if (!allowedCommands.has(command)) {
    throw new Error(`[database] comando Prisma não autorizado pelo wrapper: ${command || "ausente"}.`);
  }

  const environment = assertDatabaseEnvironmentConfiguration(process.env);
  neonConfig.webSocketConstructor = ws;
  const markerClient = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: environment.directUrl }),
  });

  try {
    await assertDatabaseMarker(markerClient, environment.appEnvId);
  } finally {
    await markerClient.$disconnect();
  }

  console.info(`[database] destino confirmado pelo marker: ${environment.appEnvId}.`);
  const executable = path.join(process.cwd(), "node_modules", ".bin", process.platform === "win32" ? "prisma.cmd" : "prisma");
  const result = spawnSync(executable, args, { env: process.env, stdio: "inherit" });

  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "[database] falha desconhecida.");
  process.exit(1);
});
