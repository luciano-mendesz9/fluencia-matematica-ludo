import "server-only";

import { randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/src/lib/prisma";
import { SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS } from "./constants";
import { sha256 } from "./crypto";
import { destinationForUser } from "./destination";
import { shouldUseSecureAuthCookie } from "./config";
import { signSessionJwt, verifySessionJwt } from "./jwt";

type SessionUser = {
  id: string;
  sessionVersion: number;
};

function epochSeconds(date: Date) {
  return Math.floor(date.getTime() / 1000);
}

function hashesEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

async function tokenForSession(user: SessionUser, session: { id: string; createdAt: Date; expiresAt: Date }) {
  return signSessionJwt({
    userId: user.id,
    sessionId: session.id,
    sessionVersion: user.sessionVersion,
    issuedAt: epochSeconds(session.createdAt),
    expiresAt: epochSeconds(session.expiresAt),
  });
}

export async function createSession(user: SessionUser, requestId: string) {
  const existing = await prisma.session.findUnique({ where: { requestId } });
  if (existing && existing.userId === user.id && !existing.revokedAt && existing.expiresAt > new Date()) {
    const token = await tokenForSession(user, existing);
    if (!hashesEqual(existing.tokenHash, sha256(token))) {
      throw new Error("[auth] sessão idempotente inconsistente.");
    }
    return { token, expiresAt: existing.expiresAt };
  }
  if (existing) throw new Error("[auth] requestId de login já consumido.");

  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + SESSION_DURATION_SECONDS * 1000);
  const session = { id: randomUUID(), createdAt, expiresAt };
  const token = await tokenForSession(user, session);

  try {
    await prisma.session.create({
      data: {
        ...session,
        requestId,
        userId: user.id,
        tokenHash: sha256(token),
      },
    });
    return { token, expiresAt };
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return createSession(user, requestId);
    }
    throw error;
  }
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: shouldUseSecureAuthCookie(),
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    priority: "high",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function validateSessionToken(token: string) {
  const claims = await verifySessionJwt(token);
  if (!claims) return null;

  const session = await prisma.session.findUnique({
    where: { id: claims.sessionId },
    include: { user: true },
  });
  const now = new Date();
  if (
    !session ||
    session.userId !== claims.userId ||
    session.revokedAt ||
    session.expiresAt <= now ||
    session.user.status !== "ACTIVE" ||
    session.user.sessionVersion !== claims.sessionVersion ||
    !hashesEqual(session.tokenHash, sha256(token))
  ) return null;

  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      studentCode: session.user.studentCode,
      globalRole: session.user.globalRole,
    },
    sessionId: session.id,
    expiresAt: session.expiresAt,
    destination: destinationForUser(session.user),
  };
}

export async function getCurrentSession() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  return token ? validateSessionToken(token) : null;
}

export async function revokeCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const claims = token ? await verifySessionJwt(token) : null;
  if (claims) {
    await prisma.session.updateMany({
      where: { id: claims.sessionId, userId: claims.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}
