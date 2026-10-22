export const GAMIFICATION_TIME_ZONE = "America/Fortaleza";

export type RankDefinition = {
  code: string;
  name: string;
  level: number;
  xpRequired: number;
  icon: string;
  accent: string;
};

export type AchievementMetric =
  | "TOTAL_XP"
  | "PODIUM_FINISH"
  | "DAILY_STREAK"
  | "CORRECT_STREAK"
  | "FIRST_PLACE"
  | "CORRECT_ANSWERS"
  | "RANK_LEVEL";

export type GamificationStats = {
  totalXp: number;
  rankingPosition: number | null;
  dailyStreak: number;
  correctStreak: number;
  correctAnswers: number;
  rankLevel: number;
};

function dateKey(date: Date, timeZone = GAMIFICATION_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function previousDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  const previous = new Date(Date.UTC(year!, month! - 1, day! - 1, 12));
  return `${previous.getUTCFullYear()}-${String(previous.getUTCMonth() + 1).padStart(2, "0")}-${String(previous.getUTCDate()).padStart(2, "0")}`;
}

export function calculateDailyStreak(activityDates: Date[], now = new Date(), timeZone = GAMIFICATION_TIME_ZONE) {
  const days = new Set(activityDates.map((date) => dateKey(date, timeZone)));
  const today = dateKey(now, timeZone);
  const yesterday = previousDateKey(today);
  let cursor = days.has(today) ? today : days.has(yesterday) ? yesterday : null;
  let streak = 0;
  while (cursor && days.has(cursor)) {
    streak += 1;
    cursor = previousDateKey(cursor);
  }
  return streak;
}

export function longestCorrectStreak(outcomes: Array<"CORRECT" | "INCORRECT">) {
  let current = 0;
  let longest = 0;
  for (const outcome of outcomes) {
    current = outcome === "CORRECT" ? current + 1 : 0;
    longest = Math.max(longest, current);
  }
  return longest;
}

export function resolveRank(ranks: RankDefinition[], totalXp: number) {
  const ordered = [...ranks].sort((left, right) => left.level - right.level);
  if (ordered.length === 0) throw new Error("O catálogo de patentes está vazio.");
  const xp = Math.max(0, totalXp);
  let threshold = 0;
  let current = ordered[0]!;
  let currentThreshold = 0;
  let next: RankDefinition | null = null;

  for (let index = 0; index < ordered.length; index += 1) {
    const rank = ordered[index]!;
    if (index > 0) threshold += rank.xpRequired;
    if (xp >= threshold) {
      current = rank;
      currentThreshold = threshold;
      next = ordered[index + 1] ?? null;
    } else {
      next = rank;
      break;
    }
  }

  const requiredForNext = next?.xpRequired ?? 0;
  const xpInRank = xp - currentThreshold;
  return {
    current,
    next,
    xpInRank,
    requiredForNext,
    progressPercent: next ? Math.min(100, Math.round((xpInRank / requiredForNext) * 100)) : 100,
  };
}

export function metricValue(metric: AchievementMetric, stats: GamificationStats) {
  if (metric === "TOTAL_XP") return stats.totalXp;
  if (metric === "DAILY_STREAK") return stats.dailyStreak;
  if (metric === "CORRECT_STREAK") return stats.correctStreak;
  if (metric === "CORRECT_ANSWERS") return stats.correctAnswers;
  if (metric === "RANK_LEVEL") return stats.rankLevel;
  if (metric === "FIRST_PLACE") return stats.rankingPosition === 1 ? 1 : 0;
  return stats.rankingPosition !== null && stats.rankingPosition <= 3 ? 3 : 0;
}

export function achievementReached(metric: AchievementMetric, threshold: number, stats: GamificationStats) {
  if (metric === "PODIUM_FINISH") return stats.rankingPosition !== null && stats.rankingPosition <= threshold;
  return metricValue(metric, stats) >= threshold;
}

export function recentDayKeys(now = new Date(), count = 7, timeZone = GAMIFICATION_TIME_ZONE) {
  const last = dateKey(now, timeZone);
  const keys = [last];
  while (keys.length < count) keys.unshift(previousDateKey(keys[0]!));
  return keys;
}

export function groupXpByDay(events: Array<{ amount: number; awardedAt: Date }>, now = new Date()) {
  const keys = recentDayKeys(now);
  const totals = new Map(keys.map((key) => [key, 0]));
  for (const event of events) {
    const key = dateKey(event.awardedAt);
    if (totals.has(key)) totals.set(key, (totals.get(key) ?? 0) + event.amount);
  }
  const dayFormatter = new Intl.DateTimeFormat("pt-BR", { weekday: "narrow", timeZone: "UTC" });
  return keys.map((key) => ({
    key,
    label: dayFormatter.format(new Date(`${key}T12:00:00Z`)).toLocaleUpperCase("pt-BR"),
    xp: totals.get(key) ?? 0,
  }));
}
