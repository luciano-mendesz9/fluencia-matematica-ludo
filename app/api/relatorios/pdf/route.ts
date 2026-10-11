import { reportDownloadResponse } from "@/src/server/reports/http";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return reportDownloadResponse(request, "pdf");
}
