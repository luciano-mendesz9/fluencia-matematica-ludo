import "server-only";

import { randomUUID } from "node:crypto";
import type { OperationalLogLevel } from "@/src/generated/prisma/client";
import { prisma } from "@/src/lib/prisma";
import { AuthorizationError } from "@/src/server/auth/errors";
import type { AuthenticatedPrincipal } from "@/src/server/auth/policies";
import { isCorrelationIdentifier, sanitizeTechnicalMetadata, sanitizeTechnicalText } from "./sanitize";

export type TechnicalLogFilters = {
  correlationId?: string;
  level?: OperationalLogLevel;
  category?: string;
  page?: number;
};

const levels = new Set<OperationalLogLevel>(["INFO", "WARN", "ERROR"]);
const PAGE_SIZE = 20;
const ACCESS_LIMIT_PER_MINUTE = 30;

function requireTechnicalActor(actor: AuthenticatedPrincipal) {
  if (actor.studentCode || !actor.globalRole || !["DEVELOPER", "SEMED_ADMIN"].includes(actor.globalRole)) {
    throw new AuthorizationError("FORBIDDEN", "Acesso técnico não autorizado.");
  }
  return actor;
}

function parseFilters(filters: TechnicalLogFilters) {
  const page = filters.page ?? 1;
  if (!Number.isInteger(page) || page < 1 || page > 100) throw new AuthorizationError("VALIDATION", "Página inválida.");
  if (filters.level && !levels.has(filters.level)) throw new AuthorizationError("VALIDATION", "Nível de log inválido.");
  const correlationId = filters.correlationId?.trim();
  if (correlationId && !isCorrelationIdentifier(correlationId)) throw new AuthorizationError("VALIDATION", "Correlation ID inválido.");
  const category = filters.category?.trim();
  if (category && !/^[a-zA-Z][a-zA-Z0-9_.-]{0,79}$/.test(category)) throw new AuthorizationError("VALIDATION", "Categoria inválida.");
  return { page, level: filters.level, correlationId: correlationId || undefined, category: category || undefined };
}

function releaseSha() {
  for (const candidate of [process.env.VERCEL_GIT_COMMIT_SHA, process.env.GITHUB_SHA, process.env.RELEASE_SHA]) {
    if (candidate && /^[0-9a-f]{7,40}$/i.test(candidate.trim())) return candidate.trim().slice(0, 12);
  }
  return "desconhecida";
}

export const retentionPolicy = {
  status: "PENDING_POLICY" as const,
  deletionsEnabled: false,
  message: "Retenção e exclusão aguardam a política municipal OD-004; nenhum evento é removido automaticamente.",
};

export async function getTechnicalOperations(input: {
  actor: AuthenticatedPrincipal;
  filters?: TechnicalLogFilters;
  now?: Date;
}) {
  const actor = requireTechnicalActor(input.actor);
  const filters = parseFilters(input.filters ?? {});
  const now = input.now ?? new Date();
  const minuteAgo = new Date(now.getTime() - 60_000);
  const dayAgo = new Date(now.getTime() - 86_400_000);
  const recentAccesses = await prisma.auditEvent.count({ where: { actorId: actor.id, action: "TECHNICAL_OPERATION_VIEWED", at: { gte: minuteAgo } } });
  if (recentAccesses >= ACCESS_LIMIT_PER_MINUTE) throw new AuthorizationError("RATE_LIMITED", "Muitas consultas técnicas. Aguarde um minuto.");

  const startedAt = performance.now();
  await prisma.$queryRaw`SELECT 1`;
  const databaseLatencyMs = Math.max(0, Math.round(performance.now() - startedAt));
  const where = {
    ...(filters.level ? { level: filters.level } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.correlationId ? { correlationId: filters.correlationId } : {}),
  };
  const [logs, totalLogs, errorCount, auditCount, categories, correlatedAudits] = await Promise.all([
    prisma.operationalLog.findMany({ where, select: { id: true, level: true, category: true, code: true, message: true, correlationId: true, metadata: true, occurredAt: true }, orderBy: [{ occurredAt: "desc" }, { id: "desc" }], skip: (filters.page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.operationalLog.count({ where }),
    prisma.operationalLog.count({ where: { level: "ERROR", occurredAt: { gte: dayAgo } } }),
    prisma.auditEvent.count({ where: { at: { gte: dayAgo } } }),
    prisma.operationalLog.findMany({ distinct: ["category"], select: { category: true }, orderBy: { category: "asc" } }),
    filters.correlationId ? prisma.auditEvent.findMany({ where: { correlationId: filters.correlationId }, select: { id: true, action: true, targetType: true, correlationId: true, at: true }, orderBy: { at: "desc" }, take: 50 }) : Promise.resolve([]),
  ]);
  const requestCorrelationId = randomUUID();
  await prisma.auditEvent.create({ data: { actorId: actor.id, action: "TECHNICAL_OPERATION_VIEWED", targetType: "TechnicalOperations", correlationId: requestCorrelationId, after: { page: filters.page, level: filters.level ?? null, category: filters.category ?? null, correlationLookup: Boolean(filters.correlationId), returnedLogs: logs.length } } });

  return {
    requestCorrelationId,
    releaseSha: releaseSha(),
    health: { database: "AVAILABLE" as const, databaseLatencyMs },
    counts: { errorsLast24Hours: errorCount, auditEventsLast24Hours: auditCount },
    retention: retentionPolicy,
    filters,
    pagination: { page: filters.page, pageSize: PAGE_SIZE, total: totalLogs, totalPages: Math.max(1, Math.ceil(totalLogs / PAGE_SIZE)) },
    categories: categories.map(({ category }) => category),
    logs: logs.map((log) => ({ ...log, message: sanitizeTechnicalText(log.message), metadata: sanitizeTechnicalMetadata(log.metadata) })),
    correlatedAudits: correlatedAudits.map((event) => ({ id: event.id, action: event.action, targetType: event.targetType, correlationId: event.correlationId, at: event.at })),
  };
}
