import "server-only";

import type { OperationalLogLevel, Prisma } from "@/src/generated/prisma/client";
import { prisma } from "@/src/lib/prisma";
import { correlationIdentifier, sanitizeTechnicalMetadata, sanitizeTechnicalText, technicalIdentifier } from "./sanitize";

export async function logOperationalEvent(input: {
  level: OperationalLogLevel;
  category: string;
  code: string;
  message: string;
  correlationId?: string;
  metadata?: unknown;
}) {
  const correlationId = correlationIdentifier(input.correlationId);
  const metadata = sanitizeTechnicalMetadata(input.metadata);
  await prisma.operationalLog.create({
    data: {
      level: input.level,
      category: technicalIdentifier(input.category, "Categoria"),
      code: technicalIdentifier(input.code, "Código"),
      message: sanitizeTechnicalText(input.message),
      correlationId,
      metadata: metadata as Prisma.InputJsonValue | undefined,
    },
  });
  return { correlationId };
}

export function sanitizedException(error: unknown) {
  if (error instanceof Error) {
    return {
      code: "UNEXPECTED_ERROR",
      message: "Falha interna não detalhada.",
      metadata: { errorType: sanitizeTechnicalText(error.name, 80) },
    };
  }
  return { code: "UNEXPECTED_ERROR", message: "Falha interna não detalhada.", metadata: null };
}
