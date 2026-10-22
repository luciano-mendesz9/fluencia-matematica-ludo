import type { AvatarOptions } from "./avatar";

export const RANKING_TIME_ZONE = "America/Fortaleza";

type RankingStudent = {
  id: string;
  name: string;
  avatar?: AvatarOptions;
  rankName?: string;
  rankIcon?: string;
};
type RankingTotal = { studentId: string; points: number };

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return { year: value("year"), month: value("month"), day: value("day"), hour: value("hour"), minute: value("minute"), second: value("second") };
}

function civilToInstant(year: number, month: number, day: number, timeZone: string) {
  const civilUtc = Date.UTC(year, month - 1, day);
  let instant = civilUtc;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const local = zonedParts(new Date(instant), timeZone);
    const offset = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second) - instant;
    instant = civilUtc - offset;
  }
  return new Date(instant);
}

export function currentMonthRange(now = new Date(), timeZone = RANKING_TIME_ZONE) {
  if (Number.isNaN(now.getTime())) throw new Error("Data de referência inválida.");
  const current = zonedParts(now, timeZone);
  const nextYear = current.month === 12 ? current.year + 1 : current.year;
  const nextMonth = current.month === 12 ? 1 : current.month + 1;
  const start = civilToInstant(current.year, current.month, 1, timeZone);
  const end = civilToInstant(nextYear, nextMonth, 1, timeZone);
  const label = new Intl.DateTimeFormat("pt-BR", { timeZone, month: "long", year: "numeric" }).format(start);
  return { start, end, label: label.charAt(0).toLocaleUpperCase("pt-BR") + label.slice(1), timeZone };
}

export function rankStudents(students: RankingStudent[], totals: RankingTotal[], currentStudentId?: string) {
  const pointsByStudent = new Map(totals.map((total) => [total.studentId, total.points]));
  const sorted = students
    .map((student) => ({ ...student, points: pointsByStudent.get(student.id) ?? 0 }))
    .sort((left, right) => right.points - left.points || left.name.localeCompare(right.name, "pt-BR", { sensitivity: "base" }));

  let position = 0;
  return sorted.map((student, index) => {
    if (index === 0 || student.points !== sorted[index - 1]!.points) position = index + 1;
    return {
      position,
      name: student.name,
      points: student.points,
      isCurrentStudent: student.id === currentStudentId,
      ...(student.avatar ? { avatar: student.avatar } : {}),
      ...(student.rankName ? { rankName: student.rankName } : {}),
      ...(student.rankIcon ? { rankIcon: student.rankIcon } : {}),
    };
  });
}
