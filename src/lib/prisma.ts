import "server-only";

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "@/src/generated/prisma/client";
import { readDatabaseEnvironment } from "@/src/server/database/environment";

neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const environment = readDatabaseEnvironment();

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter: new PrismaNeon({ connectionString: environment.databaseUrl }),
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
