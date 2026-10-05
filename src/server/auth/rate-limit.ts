import "server-only";

import { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/src/lib/prisma";

const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

function isRetryable(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2034";
}

export async function isRateLimited(keyHashes: string[], now = new Date()) {
  return Boolean(await prisma.loginThrottle.findFirst({
    where: { keyHash: { in: keyHashes }, blockedUntil: { gt: now } },
    select: { id: true },
  }));
}

export async function recordLoginFailure(keyHashes: string[], now = new Date()) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(async (transaction) => {
        let limited = false;
        for (const keyHash of keyHashes) {
          const existing = await transaction.loginThrottle.findUnique({ where: { keyHash } });
          const withinWindow = existing && existing.updatedAt.getTime() >= now.getTime() - WINDOW_MS;
          const failureCount = withinWindow ? existing.failureCount + 1 : 1;
          const blockedUntil = failureCount >= MAX_FAILURES ? new Date(now.getTime() + BLOCK_MS) : null;
          if (blockedUntil) limited = true;

          await transaction.loginThrottle.upsert({
            where: { keyHash },
            create: { keyHash, failureCount, blockedUntil, firstFailedAt: now, updatedAt: now },
            update: {
              failureCount,
              blockedUntil,
              firstFailedAt: withinWindow ? existing.firstFailedAt : now,
              updatedAt: now,
            },
          });
        }
        return limited;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (!isRetryable(error) || attempt === 2) throw error;
    }
  }
  return false;
}

export function clearIdentifierThrottle(keyHash: string) {
  return prisma.loginThrottle.deleteMany({ where: { keyHash } });
}
