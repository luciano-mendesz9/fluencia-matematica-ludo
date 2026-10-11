import type { AnalyticsFilters } from "@/src/server/analytics/service";
import { REPORT_MAX_PERIOD_DAYS } from "@/src/domain/reports";
import { AuthorizationError } from "@/src/server/auth/errors";

type SearchValue = string | string[] | undefined;

const one = (value: SearchValue) => typeof value === "string" ? value.trim() : "";

function date(value: SearchValue, endOfDay = false) {
  const raw = one(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return undefined;
  const parsed = new Date(`${raw}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}-03:00`);
  const roundTrip = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza", year: "numeric", month: "2-digit", day: "2-digit" }).format(parsed);
  if (Number.isNaN(parsed.getTime()) || roundTrip !== raw) throw new AuthorizationError("VALIDATION", "Data de relatório inválida.");
  return parsed;
}

export function analyticsFiltersFromSearch(input: Record<string, SearchValue>, schoolId?: string): AnalyticsFilters {
  const rawDifficulty = one(input.difficulty);
  const difficulty = Number(rawDifficulty);
  if (rawDifficulty && (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 6)) {
    throw new AuthorizationError("VALIDATION", "Dificuldade inválida.");
  }
  const from = date(input.from);
  const to = date(input.to, true);
  if (from && to && (to.getTime() - from.getTime()) > REPORT_MAX_PERIOD_DAYS * 86_400_000) {
    throw new AuthorizationError("VALIDATION", `O período máximo do relatório é de ${REPORT_MAX_PERIOD_DAYS} dias.`);
  }
  return {
    schoolId: schoolId || one(input.schoolId) || undefined,
    classId: one(input.classId) || undefined,
    activityId: one(input.activityId) || undefined,
    studentId: one(input.studentId) || undefined,
    skillId: one(input.skillId) || undefined,
    difficulty: rawDifficulty ? difficulty : undefined,
    from,
    to,
  };
}

export function analyticsFiltersFromUrl(searchParams: URLSearchParams) {
  return analyticsFiltersFromSearch(Object.fromEntries(searchParams.entries()));
}

export function dateInputValue(value?: Date) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza", year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
}
