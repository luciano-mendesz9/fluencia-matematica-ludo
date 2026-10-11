import "server-only";

import { logOperationalEvent, sanitizedException } from "./logger";
import { correlationIdentifier } from "./sanitize";

export async function technicalFailureResponse(input: { request: Request; error: unknown; category: string; code: string }) {
  const correlationId = correlationIdentifier(input.request.headers.get("x-correlation-id") ?? undefined);
  const failure = sanitizedException(input.error);
  await logOperationalEvent({
    level: "ERROR",
    category: input.category,
    code: input.code,
    message: failure.message,
    correlationId,
    metadata: { ...(failure.metadata ?? {}), method: input.request.method },
  }).catch(() => undefined);
  return Response.json(
    { error: failure.code, message: failure.message, correlationId },
    { status: 500, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "X-Correlation-ID": correlationId } },
  );
}
