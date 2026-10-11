import "server-only";

import { AuthorizationError } from "@/src/server/auth/errors";
import { requireUser } from "@/src/server/auth/policies";
import { analyticsFiltersFromUrl } from "@/src/features/analytics/filters";
import { correlationIdentifier } from "@/src/server/operations/sanitize";
import { technicalFailureResponse } from "@/src/server/operations/http";
import { getAuthorizedReportDataset } from "./dataset";
import { buildPdfReport } from "./pdf";
import { buildXlsxReport } from "./xlsx";
import { safeReportFilename } from "@/src/domain/reports";

const timeoutMs = 15_000;
const statusFor = (code: AuthorizationError["code"]) => ({ UNAUTHENTICATED: 401, FORBIDDEN: 403, NOT_FOUND: 404, VALIDATION: 422, STATE_CONFLICT: 409, RATE_LIMITED: 429 })[code];

async function withinTimeout<T>(operation: Promise<T>) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new AuthorizationError("VALIDATION", "A geração excedeu o tempo permitido. Refine os filtros.")), timeoutMs); }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function reportDownloadResponse(request: Request, format: "pdf" | "xlsx") {
  const correlationId = correlationIdentifier(request.headers.get("x-correlation-id") ?? undefined);
  try {
    const actor = await requireUser();
    const query = analyticsFiltersFromUrl(new URL(request.url).searchParams);
    const dataset = await withinTimeout(getAuthorizedReportDataset({ actor, query }));
    const bytes = await withinTimeout(format === "pdf" ? buildPdfReport(dataset) : buildXlsxReport(dataset));
    const filename = safeReportFilename({ format, generatedAt: dataset.generatedAt });
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "X-Content-Type-Options": "nosniff",
        "X-Correlation-ID": correlationId,
      },
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return Response.json(
        { error: error.code, message: error.message, correlationId },
        { status: statusFor(error.code), headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "X-Correlation-ID": correlationId } },
      );
    }
    return technicalFailureResponse({ request, error, category: "report-export", code: `EXPORT_${format.toUpperCase()}_UNEXPECTED` });
  }
}
