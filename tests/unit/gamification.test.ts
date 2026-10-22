import { describe, expect, it } from "vitest";
import {
  achievementReached,
  calculateDailyStreak,
  groupXpByDay,
  longestCorrectStreak,
  resolveRank,
  type RankDefinition,
} from "../../src/domain/gamification";

const ranks: RankDefinition[] = Array.from({ length: 10 }, (_, level) => ({
  code: level === 0 ? "BRONZE" : level === 1 ? "SILVER" : `RANK_${level}`,
  name: level === 0 ? "Bronze" : level === 1 ? "Prata" : `Patente ${level}`,
  level,
  xpRequired: level === 0 ? 0 : 50,
  icon: "★",
  accent: "#1769E0",
}));

describe("FM-028 gamificação do aluno", () => {
  it("começa em Bronze, promove Prata no nível 1 e usa 50 XP fixos por patente", () => {
    expect(resolveRank(ranks, 0)).toMatchObject({ current: { name: "Bronze", level: 0 }, next: { name: "Prata", level: 1 }, xpInRank: 0, requiredForNext: 50, progressPercent: 0 });
    expect(resolveRank(ranks, 49).current.level).toBe(0);
    expect(resolveRank(ranks, 50)).toMatchObject({ current: { name: "Prata", level: 1 }, xpInRank: 0, requiredForNext: 50 });
    expect(resolveRank(ranks, 375)).toMatchObject({ current: { level: 7 }, xpInRank: 25, progressPercent: 50 });
    expect(resolveRank(ranks, 450)).toMatchObject({ current: { level: 9 }, next: null, progressPercent: 100 });
  });

  it("calcula sequência civil de Fortaleza sem punir quem praticou ontem", () => {
    const now = new Date("2026-10-22T15:00:00.000Z");
    expect(calculateDailyStreak([
      new Date("2026-10-20T13:00:00.000Z"),
      new Date("2026-10-21T13:00:00.000Z"),
      new Date("2026-10-22T13:00:00.000Z"),
    ], now)).toBe(3);
    expect(calculateDailyStreak([new Date("2026-10-21T13:00:00.000Z")], now)).toBe(1);
    expect(calculateDailyStreak([new Date("2026-10-20T13:00:00.000Z")], now)).toBe(0);
  });

  it("mede a maior sequência de acertos e os critérios reduzidos das conquistas", () => {
    expect(longestCorrectStreak(["CORRECT", "CORRECT", "INCORRECT", "CORRECT", "CORRECT", "CORRECT"])).toBe(3);
    const stats = { totalXp: 100, rankingPosition: 3, dailyStreak: 3, correctStreak: 3, correctAnswers: 5, rankLevel: 2 };
    expect(achievementReached("TOTAL_XP", 100, stats)).toBe(true);
    expect(achievementReached("PODIUM_FINISH", 3, stats)).toBe(true);
    expect(achievementReached("FIRST_PLACE", 1, stats)).toBe(false);
    expect(achievementReached("RANK_LEVEL", 7, stats)).toBe(false);
  });

  it("agrupa somente os sete dias recentes sem inventar XP", () => {
    const days = groupXpByDay([
      { amount: 10, awardedAt: new Date("2026-10-22T12:00:00Z") },
      { amount: 7, awardedAt: new Date("2026-10-22T14:00:00Z") },
      { amount: 30, awardedAt: new Date("2026-10-15T12:00:00Z") },
    ], new Date("2026-10-22T15:00:00Z"));
    expect(days).toHaveLength(7);
    expect(days.at(-1)).toMatchObject({ key: "2026-10-22", xp: 17 });
    expect(days.reduce((sum, day) => sum + day.xp, 0)).toBe(17);
  });
});
