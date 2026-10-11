import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma";
import type { AuthenticatedPrincipal } from "../../src/server/auth/policies";
import { assertDatabaseMarker } from "../../src/server/database/marker";
import { readDatabaseEnvironment } from "../../src/server/database/environment";
import { logOperationalEvent } from "../../src/server/operations/logger";
import { getTechnicalOperations, retentionPolicy } from "../../src/server/operations/service";

const suffix = randomUUID();
const correlationId = `fm023-${suffix}`;
const userIds: string[] = [];
let developer: AuthenticatedPrincipal;
let admin: AuthenticatedPrincipal;
let teacher: AuthenticatedPrincipal;
let historicalAuditId = "";

describe.sequential("FM-023 auditoria e operação técnica", () => {
  beforeAll(async () => {
    await assertDatabaseMarker(prisma, readDatabaseEnvironment().appEnvId);
    const users = await Promise.all([
      { name: "Developer FM023", role: "DEVELOPER" as const },
      { name: "Admin FM023", role: "SEMED_ADMIN" as const },
      { name: "Professor FM023", role: null },
    ].map((entry, index) => prisma.user.create({ data: { name: entry.name, email: `fm023-${index}-${suffix}@example.invalid`, normalizedEmail: `fm023-${index}-${suffix}@example.invalid`, passwordHash: "hash-de-teste", globalRole: entry.role } })));
    userIds.push(...users.map(({ id }) => id));
    [developer, admin, teacher] = users.map((user) => ({ id: user.id, name: user.name, globalRole: user.globalRole, studentCode: null }));
    const historical = await prisma.auditEvent.create({ data: { actorId: admin.id, action: "ACTIVITY_OPENED", targetType: "Activity", targetId: randomUUID(), correlationId, before: { status: "DRAFT" }, after: { status: "OPEN", answer: "NUNCA-EXPOR" } } });
    historicalAuditId = historical.id;
    await logOperationalEvent({ level: "ERROR", category: "database", code: "CONNECTION_TIMEOUT", correlationId, message: "falha\n pessoa@example.invalid postgres://user:pass@host/db", metadata: { durationMs: 220, token: "segredo", studentName: "Aluno Privado", nested: { code: "P1001", answer: "42" } } });
  });

  afterAll(async () => {
    await prisma.operationalLog.deleteMany({ where: { correlationId } });
    await prisma.auditEvent.deleteMany({ where: { OR: [{ correlationId }, { actorId: { in: userIds }, action: "TECHNICAL_OPERATION_VIEWED" }] } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  });

  it("preserva evento anterior, retorna DTO allowlisted e audita a própria consulta", async () => {
    const result = await getTechnicalOperations({ actor: developer, filters: { correlationId } });
    expect(result.logs).toHaveLength(1);
    expect(result.correlatedAudits).toContainEqual(expect.objectContaining({ id: historicalAuditId, action: "ACTIVITY_OPENED", targetType: "Activity", correlationId }));
    expect(Object.keys(result.correlatedAudits[0]!)).toEqual(["id", "action", "targetType", "correlationId", "at"]);
    expect(JSON.stringify(result)).not.toMatch(/NUNCA-EXPOR|segredo|Aluno Privado|pessoa@example|user:pass|\"answer\"/i);
    await expect(prisma.auditEvent.count({ where: { actorId: developer.id, action: "TECHNICAL_OPERATION_VIEWED" } })).resolves.toBe(1);
  });

  it("autoriza SEMED, nega professor e valida filtros no servidor", async () => {
    await expect(getTechnicalOperations({ actor: admin, filters: { level: "ERROR" } })).resolves.toMatchObject({ filters: { level: "ERROR" } });
    await expect(getTechnicalOperations({ actor: teacher })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(getTechnicalOperations({ actor: developer, filters: { correlationId: "forjado\nlog" } })).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("impede alteração de auditoria no banco e mantém retenção desativada", async () => {
    await expect(prisma.$executeRaw`UPDATE "AuditEvent" SET "action" = 'TAMPERED' WHERE "id" = ${historicalAuditId}::uuid`).rejects.toThrow(/append-only/i);
    await expect(prisma.auditEvent.findUniqueOrThrow({ where: { id: historicalAuditId } })).resolves.toMatchObject({ action: "ACTIVITY_OPENED" });
    expect(retentionPolicy).toMatchObject({ status: "PENDING_POLICY", deletionsEnabled: false });
  });

  it("permite apenas anonimizar a referência do ator quando a conta é removida", async () => {
    const disposable = await prisma.user.create({ data: { name: "Ator descartável FM023", email: `fm023-disposable-${suffix}@example.invalid`, normalizedEmail: `fm023-disposable-${suffix}@example.invalid`, passwordHash: "hash-de-teste" } });
    userIds.push(disposable.id);
    const event = await prisma.auditEvent.create({ data: { actorId: disposable.id, action: "ACCOUNT_PROBE", targetType: "User", targetId: disposable.id, correlationId, after: { status: "ACTIVE" } } });
    await prisma.user.delete({ where: { id: disposable.id } });
    await expect(prisma.auditEvent.findUniqueOrThrow({ where: { id: event.id } })).resolves.toMatchObject({ actorId: null, action: "ACCOUNT_PROBE", targetId: disposable.id, after: { status: "ACTIVE" } });
  });

  it("limita rajadas de leitura técnica por ator", async () => {
    await prisma.auditEvent.createMany({ data: Array.from({ length: 30 }, (_, index) => ({ actorId: developer.id, action: "TECHNICAL_OPERATION_VIEWED", targetType: "TechnicalOperations", correlationId: `fm023-rate-${index}-${suffix}` })) });
    await expect(getTechnicalOperations({ actor: developer })).rejects.toMatchObject({ code: "RATE_LIMITED" });
  });
});
