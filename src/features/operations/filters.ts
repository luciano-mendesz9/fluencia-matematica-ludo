import type { OperationalLogLevel } from "@/src/generated/prisma/client";
import type { TechnicalLogFilters } from "@/src/server/operations/service";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function technicalFiltersFromSearch(search: Record<string, string | string[] | undefined>): TechnicalLogFilters {
  const rawPage = first(search.page);
  const rawLevel = first(search.level);
  return {
    correlationId: first(search.correlationId),
    category: first(search.category),
    level: rawLevel && ["INFO", "WARN", "ERROR"].includes(rawLevel) ? rawLevel as OperationalLogLevel : rawLevel as OperationalLogLevel | undefined,
    page: rawPage ? Number(rawPage) : 1,
  };
}
