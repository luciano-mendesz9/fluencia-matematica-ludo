import type { AnalyticsFilters } from "@/src/server/analytics/service";

type SearchValue = string | string[] | undefined;

const one = (value: SearchValue) => typeof value === "string" ? value.trim() : "";

function date(value: SearchValue, endOfDay = false) {
  const raw = one(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return undefined;
  return new Date(`${raw}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}-03:00`);
}

export function analyticsFiltersFromSearch(input: Record<string, SearchValue>, schoolId?: string): AnalyticsFilters {
  const difficulty = Number(one(input.difficulty));
  return {
    schoolId: schoolId || one(input.schoolId) || undefined,
    classId: one(input.classId) || undefined,
    activityId: one(input.activityId) || undefined,
    studentId: one(input.studentId) || undefined,
    skillId: one(input.skillId) || undefined,
    difficulty: Number.isInteger(difficulty) && difficulty >= 1 && difficulty <= 6 ? difficulty : undefined,
    from: date(input.from),
    to: date(input.to, true),
  };
}

export function dateInputValue(value?: Date) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza", year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
}
