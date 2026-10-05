import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/src/lib/prisma";

const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const MAX_TRANSACTION_ATTEMPTS = 3;

function isRetryable(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2034";
}

export async function isRateLimited(keyHashes: string[], now = new Date()) {
  return Boolean(await prisma.loginThrottle.findFirst({
    where: { keyHash: { in: keyHashes }, blockedUntil: { gt: now } },
    select: { id: true },
  }));
}

export async function recordRateLimitHit(keyHashes: string[], now = new Date()) {
  const nowIso = now.toISOString();
  const windowStartIso = new Date(now.getTime() - WINDOW_MS).toISOString();
  const blockedUntilIso = new Date(now.getTime() + BLOCK_MS).toISOString();

  for (let attempt = 0; attempt < MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(async (transaction) => {
        let limited = false;
        for (const keyHash of keyHashes) {
          const rows = await transaction.$queryRaw<Array<{ limited: boolean }>>(Prisma.sql`
            INSERT INTO "LoginThrottle" ("id", "keyHash", "failureCount", "blockedUntil", "firstFailedAt", "updatedAt")
            VALUES (${randomUUID()}::uuid, ${keyHash}, 1, NULL::timestamptz, ${nowIso}::timestamptz, ${nowIso}::timestamptz)
            ON CONFLICT ("keyHash") DO UPDATE SET
              "failureCount" = CASE
                WHEN "LoginThrottle"."updatedAt" >= ${windowStartIso}::timestamptz
                  THEN "LoginThrottle"."failureCount" + 1
                ELSE 1
              END,
              "blockedUntil" = CASE
                WHEN (CASE
                  WHEN "LoginThrottle"."updatedAt" >= ${windowStartIso}::timestamptz
                    THEN "LoginThrottle"."failureCount" + 1
                  ELSE 1
                END) >= ${MAX_FAILURES}
                  THEN ${blockedUntilIso}::timestamptz
                ELSE NULL::timestamptz
              END,
              "firstFailedAt" = CASE
                WHEN "LoginThrottle"."updatedAt" >= ${windowStartIso}::timestamptz
                  THEN "LoginThrottle"."firstFailedAt"
                ELSE ${nowIso}::timestamptz
              END,
              "updatedAt" = ${nowIso}::timestamptz
            RETURNING "blockedUntil" IS NOT NULL AND "blockedUntil" > ${nowIso}::timestamptz AS "limited"
          `);
          if (rows[0]?.limited) limited = true;
        }
        return limited;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
    } catch (error) {
      if (!isRetryable(error) || attempt === MAX_TRANSACTION_ATTEMPTS - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 10));
    }
  }
  return false;
}

export const recordLoginFailure = recordRateLimitHit;

export function clearIdentifierThrottle(keyHash: string) {
  return prisma.loginThrottle.deleteMany({ where: { keyHash } });
}
