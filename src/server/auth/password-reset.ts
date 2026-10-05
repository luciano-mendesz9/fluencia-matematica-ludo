import "server-only";

import { randomBytes, randomUUID } from "node:crypto";
import { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/src/lib/prisma";
import { AuthorizationError } from "./errors";
import { sha256 } from "./crypto";
import { normalizeIdentifier } from "./normalization";
import { hashPassword } from "./password";
import { newPasswordSchema } from "./password-policy";
import type { AuthenticatedPrincipal } from "./policies";
import type { AdultPasswordResetDelivery } from "./reset-delivery";

const RESET_DURATION_MS = 30 * 60 * 1000;
const SERIALIZABLE_RETRIES = 3;

type CoordinatorStudentResetAuthorization = (input: {
  actorId: string;
  studentId: string;
}) => Promise<{ schoolId: string; role: "COORDINATOR" } | null>;

function isTransactionConflict(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2034";
}

async function serializable<T>(operation: () => Promise<T>) {
  for (let attempt = 1; attempt <= SERIALIZABLE_RETRIES; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!isTransactionConflict(error) || attempt === SERIALIZABLE_RETRIES) throw error;
    }
  }
  throw new Error("[auth] transação serializável não concluída.");
}

export async function requestAdultReset(input: {
  email: string;
  delivery: AdultPasswordResetDelivery;
  now?: Date;
  correlationId?: string;
}) {
  const normalized = normalizeIdentifier(input.email);
  if (normalized.kind !== "adult") return { accepted: true as const };

  const user = await prisma.user.findFirst({
    where: {
      normalizedEmail: normalized.value,
      studentCode: null,
      status: "ACTIVE",
    },
    select: { id: true, email: true },
  });
  if (!user?.email) return { accepted: true as const };

  const now = input.now ?? new Date();
  const expiresAt = new Date(now.getTime() + RESET_DURATION_MS);
  const token = randomBytes(32).toString("base64url");
  const correlationId = input.correlationId ?? randomUUID();
  const reset = await prisma.$transaction(async (transaction) => {
    await transaction.passwordReset.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: now },
    });
    const created = await transaction.passwordReset.create({
      data: { userId: user.id, tokenHash: sha256(token), expiresAt },
      select: { id: true },
    });
    await transaction.auditEvent.create({
      data: {
        action: "PASSWORD_RESET_REQUESTED",
        targetType: "User",
        targetId: user.id,
        correlationId,
        after: { channel: "email", expiresAt: expiresAt.toISOString() },
      },
    });
    return created;
  });

  try {
    await input.delivery.send({ recipient: user.email, token, expiresAt });
  } catch {
    await prisma.$transaction([
      prisma.passwordReset.updateMany({ where: { id: reset.id, usedAt: null }, data: { usedAt: new Date() } }),
      prisma.auditEvent.create({
        data: {
          action: "PASSWORD_RESET_DELIVERY_FAILED",
          targetType: "User",
          targetId: user.id,
          correlationId,
          after: { channel: "email" },
        },
      }),
    ]);
  }
  return { accepted: true as const };
}

export async function consumeReset(input: {
  token: string;
  newPassword: string;
  now?: Date;
  correlationId?: string;
}) {
  const password = newPasswordSchema.safeParse(input.newPassword);
  if (!password.success || input.token.length < 32 || input.token.length > 256) return { ok: false as const };

  const tokenHash = sha256(input.token);
  const passwordHash = await hashPassword(password.data);
  const now = input.now ?? new Date();
  const correlationId = input.correlationId ?? randomUUID();

  return serializable(() => prisma.$transaction(async (transaction) => {
    const reset = await transaction.passwordReset.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, expiresAt: true, usedAt: true, user: { select: { studentCode: true, status: true } } },
    });
    if (!reset || reset.usedAt || reset.expiresAt <= now || reset.user.studentCode || reset.user.status !== "ACTIVE") {
      return { ok: false as const };
    }

    const claimed = await transaction.passwordReset.updateMany({
      where: { id: reset.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (claimed.count !== 1) return { ok: false as const };

    await transaction.user.update({
      where: { id: reset.userId },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    });
    await transaction.session.updateMany({ where: { userId: reset.userId, revokedAt: null }, data: { revokedAt: now } });
    await transaction.passwordReset.updateMany({ where: { userId: reset.userId, usedAt: null }, data: { usedAt: now } });
    await transaction.auditEvent.create({
      data: {
        actorId: reset.userId,
        action: "PASSWORD_RESET_CONSUMED",
        targetType: "User",
        targetId: reset.userId,
        correlationId,
        after: { sessionsRevoked: true },
      },
    });
    return { ok: true as const };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
}

export async function resetStudentPassword(input: {
  actor: AuthenticatedPrincipal;
  studentId: string;
  newPassword: string;
  authorizeCoordinator?: CoordinatorStudentResetAuthorization;
  correlationId?: string;
}) {
  const password = newPasswordSchema.safeParse(input.newPassword);
  if (!password.success) throw new AuthorizationError("VALIDATION", password.error.issues[0]?.message ?? "Senha inválida.");

  const student = await prisma.user.findFirst({
    where: { id: input.studentId, studentCode: { not: null } },
    select: { id: true },
  });
  if (!student) throw new AuthorizationError("NOT_FOUND", "Aluno não encontrado.");

  let schoolId: string | undefined;
  if (input.actor.globalRole !== "SEMED_ADMIN") {
    const authorization = await input.authorizeCoordinator?.({ actorId: input.actor.id, studentId: student.id });
    if (!authorization || authorization.role !== "COORDINATOR") {
      throw new AuthorizationError("FORBIDDEN", "Redefinição de aluno não autorizada.");
    }
    schoolId = authorization.schoolId;
  }

  const passwordHash = await hashPassword(password.data);
  const now = new Date();
  const correlationId = input.correlationId ?? randomUUID();
  await prisma.$transaction(async (transaction) => {
    await transaction.user.update({
      where: { id: student.id },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    });
    await transaction.session.updateMany({ where: { userId: student.id, revokedAt: null }, data: { revokedAt: now } });
    await transaction.passwordReset.updateMany({ where: { userId: student.id, usedAt: null }, data: { usedAt: now } });
    await transaction.auditEvent.create({
      data: {
        actorId: input.actor.id,
        action: "STUDENT_PASSWORD_RESET",
        targetType: "User",
        targetId: student.id,
        schoolId,
        correlationId,
        after: { sessionsRevoked: true },
      },
    });
  });
  return { ok: true as const };
}

export async function revokeUserSessions(input: {
  actor: AuthenticatedPrincipal;
  targetUserId: string;
  correlationId?: string;
}) {
  if (input.actor.id !== input.targetUserId && input.actor.globalRole !== "SEMED_ADMIN") {
    throw new AuthorizationError("FORBIDDEN", "Revogação de sessão não autorizada.");
  }
  const now = new Date();
  const result = await prisma.$transaction(async (transaction) => {
    const target = await transaction.user.findUnique({ where: { id: input.targetUserId }, select: { id: true } });
    if (!target) throw new AuthorizationError("NOT_FOUND", "Usuário não encontrado.");
    await transaction.user.update({ where: { id: target.id }, data: { sessionVersion: { increment: 1 } } });
    const revoked = await transaction.session.updateMany({ where: { userId: target.id, revokedAt: null }, data: { revokedAt: now } });
    await transaction.auditEvent.create({
      data: {
        actorId: input.actor.id,
        action: "USER_SESSIONS_REVOKED",
        targetType: "User",
        targetId: target.id,
        correlationId: input.correlationId ?? randomUUID(),
        after: { revokedSessions: revoked.count },
      },
    });
    return revoked.count;
  });
  return { ok: true as const, revokedSessions: result };
}
