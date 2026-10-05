import "server-only";

import { prisma } from "@/src/lib/prisma";
import { throttleKey } from "./crypto";
import { normalizeIdentifier } from "./normalization";
import { verifyPassword } from "./password";
import { clearIdentifierThrottle, isRateLimited, recordLoginFailure } from "./rate-limit";
import { createSession } from "./session";
import { destinationForUser } from "./destination";

export type AuthenticationResult =
  | { ok: true; token: string; expiresAt: Date; redirect: string }
  | { ok: false; reason: "INVALID_CREDENTIALS" | "RATE_LIMITED" };

export async function authenticate(input: {
  identifier: string;
  password: string;
  requestId: string;
  ipAddress: string;
}): Promise<AuthenticationResult> {
  const normalized = normalizeIdentifier(input.identifier);
  const identifierKey = throttleKey("identifier", `${normalized.kind}:${normalized.value}`);
  const ipKey = throttleKey("ip", input.ipAddress.slice(0, 128));
  const throttleKeys = [identifierKey, ipKey];

  if (await isRateLimited(throttleKeys)) return { ok: false, reason: "RATE_LIMITED" };

  const user = await prisma.user.findFirst({
    where: normalized.kind === "adult"
      ? { normalizedEmail: normalized.value }
      : { studentCode: normalized.value },
  });
  const passwordMatches = await verifyPassword(input.password, user?.passwordHash);

  if (!user || !passwordMatches || user.status !== "ACTIVE") {
    const limited = await recordLoginFailure(throttleKeys);
    return { ok: false, reason: limited ? "RATE_LIMITED" : "INVALID_CREDENTIALS" };
  }

  await clearIdentifierThrottle(identifierKey);
  const session = await createSession(user, input.requestId);
  return { ok: true, ...session, redirect: destinationForUser(user) };
}
