import "server-only";

import type { Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/src/lib/prisma";
import { AuthorizationError } from "@/src/server/auth/errors";
import type { AuthenticatedPrincipal } from "@/src/server/auth/policies";

export type DatabaseClient = typeof prisma | Prisma.TransactionClient;

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function authorizeSchoolManager(
  client: DatabaseClient,
  actor: AuthenticatedPrincipal,
  schoolId: string,
  options: { requireActiveSchool?: boolean } = {},
) {
  if (!isUuid(schoolId)) throw new AuthorizationError("VALIDATION", "Escola inválida.");
  const school = await client.school.findUnique({
    where: { id: schoolId },
    select: { id: true, name: true, status: true },
  });
  if (!school) throw new AuthorizationError("NOT_FOUND", "Escola não encontrada.");
  if (options.requireActiveSchool && school.status !== "ACTIVE") {
    throw new AuthorizationError("STATE_CONFLICT", "A escola precisa estar ativa para receber novos cadastros.");
  }
  if (actor.globalRole === "SEMED_ADMIN") return school;
  if (actor.globalRole || actor.studentCode) throw new AuthorizationError("FORBIDDEN", "Acesso não autorizado.");
  const now = new Date();
  const membership = await client.schoolMembership.findFirst({
    where: {
      userId: actor.id,
      schoolId,
      role: "COORDINATOR",
      status: "ACTIVE",
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      school: { status: "ACTIVE" },
    },
    select: { id: true },
  });
  if (!membership) throw new AuthorizationError("FORBIDDEN", "Vínculo escolar não autorizado.");
  return school;
}
