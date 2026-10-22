import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@/src/generated/prisma/client";
import {
  HAIR_COLORS,
  HAIR_STYLES,
  isAvatarOption,
  normalizeAvatar,
  OUTFIT_COLORS,
  SKIN_TONES,
  type AvatarOptions,
} from "@/src/domain/avatar";
import {
  achievementReached,
  calculateDailyStreak,
  groupXpByDay,
  longestCorrectStreak,
  resolveRank,
  type AchievementMetric,
  type GamificationStats,
} from "@/src/domain/gamification";
import { prisma } from "@/src/lib/prisma";
import { AuthorizationError } from "@/src/server/auth/errors";
import type { AuthenticatedPrincipal } from "@/src/server/auth/policies";
import { getStudentMonthlyRanking } from "@/src/server/rankings/service";

const activeAt = (now: Date) => ({
  status: "ACTIVE" as const,
  startsAt: { lte: now },
  OR: [{ endsAt: null }, { endsAt: { gt: now } }],
});

const STUDENT_SHOWCASE_SLUGS = ["ludo", "math-race"] as const;
const MATH_RACE_SHOWCASE = {
  id: "02820000-0000-4000-8000-000000000001",
  slug: "math-race",
  name: "Corrida Matemática",
  description: "Resolva desafios e avance em uma corrida cheia de cálculos.",
  icon: "🏁",
  status: "COMING_SOON" as const,
  sortOrder: 1,
};

function assertStudent(actor: AuthenticatedPrincipal) {
  if (!actor.studentCode || actor.globalRole) throw new AuthorizationError("FORBIDDEN", "Acesso exclusivo do aluno.");
}

function avatarDto(profile: { skinTone: string; outfitColor: string; hairStyle: string; hairColor: string; revision: number } | null) {
  return { ...normalizeAvatar(profile), revision: profile?.revision ?? 0 };
}

export async function getStudentGamification(input: { actor: AuthenticatedPrincipal; now?: Date }) {
  assertStudent(input.actor);
  const now = input.now ?? new Date();
  const ranking = await getStudentMonthlyRanking({ actor: input.actor, now });
  const currentRanking = ranking.entries.find((entry) => entry.isCurrentStudent);
  const weeklyStart = new Date(now.getTime() - 8 * 86_400_000);

  const [ranks, achievements, pointAggregate, weeklyEvents, attempts, profile, unlocked] = await Promise.all([
    prisma.studentRank.findMany({ orderBy: { level: "asc" } }),
    prisma.achievement.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.pointEvent.aggregate({ where: { studentId: input.actor.id }, _sum: { amount: true } }),
    prisma.pointEvent.findMany({ where: { studentId: input.actor.id, awardedAt: { gte: weeklyStart, lte: now } }, select: { amount: true, awardedAt: true } }),
    prisma.answerAttempt.findMany({ where: { participation: { studentId: input.actor.id } }, select: { outcome: true, acceptedAt: true }, orderBy: [{ acceptedAt: "asc" }, { id: "asc" }] }),
    prisma.studentProfile.findUnique({ where: { studentId: input.actor.id }, select: { skinTone: true, outfitColor: true, hairStyle: true, hairColor: true, revision: true } }),
    prisma.studentAchievement.findMany({ where: { studentId: input.actor.id }, select: { achievementId: true, unlockedAt: true } }),
  ]);

  const totalXp = pointAggregate._sum.amount ?? 0;
  const rank = resolveRank(ranks, totalXp);
  const stats: GamificationStats = {
    totalXp,
    rankingPosition: currentRanking?.position ?? null,
    dailyStreak: calculateDailyStreak(attempts.map((attempt) => attempt.acceptedAt), now),
    correctStreak: longestCorrectStreak(attempts.map((attempt) => attempt.outcome)),
    correctAnswers: attempts.filter((attempt) => attempt.outcome === "CORRECT").length,
    rankLevel: rank.current.level,
  };

  const unlockedIds = new Set(unlocked.map((item) => item.achievementId));
  const earned = achievements.filter((achievement) => !unlockedIds.has(achievement.id) && achievementReached(achievement.metric as AchievementMetric, achievement.threshold, stats));
  if (earned.length) {
    await prisma.studentAchievement.createMany({
      data: earned.map((achievement) => ({ studentId: input.actor.id, achievementId: achievement.id, unlockedAt: now })),
      skipDuplicates: true,
    });
  }

  const persisted = earned.length
    ? await prisma.studentAchievement.findMany({ where: { studentId: input.actor.id }, select: { achievementId: true, unlockedAt: true } })
    : unlocked;
  const unlockedAt = new Map(persisted.map((item) => [item.achievementId, item.unlockedAt]));

  return {
    classGroup: ranking.classGroup,
    monthLabel: ranking.monthLabel,
    rankingPosition: currentRanking?.position ?? null,
    rankingPoints: currentRanking?.points ?? 0,
    totalXp,
    weeklyXp: weeklyEvents.reduce((sum, event) => sum + event.amount, 0),
    week: groupXpByDay(weeklyEvents, now),
    dailyStreak: stats.dailyStreak,
    correctStreak: stats.correctStreak,
    correctAnswers: stats.correctAnswers,
    rank,
    profile: avatarDto(profile),
    achievements: achievements.map((achievement) => ({
      id: achievement.id,
      code: achievement.code,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      threshold: achievement.threshold,
      metric: achievement.metric,
      unlocked: unlockedAt.has(achievement.id),
      unlockedAt: unlockedAt.get(achievement.id) ?? null,
    })),
  };
}

export async function listStudentMinigames(input: { actor: AuthenticatedPrincipal; now?: Date }) {
  assertStudent(input.actor);
  const now = input.now ?? new Date();
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId: input.actor.id,
      ...activeAt(now),
      student: { status: "ACTIVE" },
      school: { status: "ACTIVE" },
      classGroup: { status: "ACTIVE", academicYear: { status: "ACTIVE" } },
    },
    select: { id: true },
    orderBy: { startsAt: "desc" },
  });
  if (!enrollment) throw new AuthorizationError("FORBIDDEN", "Matrícula ativa não encontrada.");

  const [catalog, participations] = await Promise.all([
    prisma.minigame.findMany({
      where: { slug: { in: [...STUDENT_SHOWCASE_SLUGS] } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.activityParticipation.findMany({
      where: { studentId: input.actor.id, enrollmentId: enrollment.id, activity: { status: "OPEN" } },
      select: {
        id: true,
        activityId: true,
        acceptedAnswers: true,
        targetReachedAt: true,
        activity: {
          select: {
            title: true,
            targetCount: true,
            teacher: { select: { name: true } },
            minigameId: true,
            minigame: { select: { slug: true } },
          },
        },
      },
      orderBy: { activity: { openedAt: "desc" } },
    }),
  ]);

  const showcaseCatalog = catalog.some((game) => game.slug === MATH_RACE_SHOWCASE.slug)
    ? catalog
    : [...catalog, MATH_RACE_SHOWCASE];

  return showcaseCatalog
    .sort((first, second) => first.sortOrder - second.sortOrder)
    .map((game) => {
    const mission = participations.find((item) => item.activity.minigameId === game.id || (!item.activity.minigameId && game.slug === "ludo"));
    return {
      id: game.id,
      slug: game.slug,
      name: game.name,
      description: game.description,
      icon: game.icon,
      comingSoon: game.status === "COMING_SOON",
      unlocked: game.status === "ACTIVE" && Boolean(mission),
      mission: mission ? {
        activityId: mission.activityId,
        title: mission.activity.title,
        teacherName: mission.activity.teacher.name,
        acceptedAnswers: mission.acceptedAnswers,
        targetCount: mission.activity.targetCount,
        targetReached: Boolean(mission.targetReachedAt),
      } : null,
    };
    });
}

function validateAvatar(options: AvatarOptions) {
  if (!isAvatarOption(SKIN_TONES, options.skinTone)
    || !isAvatarOption(OUTFIT_COLORS, options.outfitColor)
    || !isAvatarOption(HAIR_STYLES, options.hairStyle)
    || !isAvatarOption(HAIR_COLORS, options.hairColor)) {
    throw new AuthorizationError("VALIDATION", "As opções do avatar não são válidas.");
  }
}

export async function updateStudentAvatar(input: {
  actor: AuthenticatedPrincipal;
  options: AvatarOptions;
  revision: number;
  correlationId?: string;
}) {
  assertStudent(input.actor);
  validateAvatar(input.options);
  if (!Number.isInteger(input.revision) || input.revision < 0) throw new AuthorizationError("VALIDATION", "Revisão inválida.");

  return prisma.$transaction(async (tx) => {
    const student = await tx.user.findFirst({
      where: { id: input.actor.id, status: "ACTIVE", studentCode: { not: null }, globalRole: null },
      select: {
        id: true,
        studentProfile: { select: { skinTone: true, outfitColor: true, hairStyle: true, hairColor: true, revision: true } },
        enrollments: { where: { status: "ACTIVE" }, select: { schoolId: true }, orderBy: { startsAt: "desc" }, take: 1 },
      },
    });
    if (!student) throw new AuthorizationError("FORBIDDEN", "Aluno não autorizado.");
    const before = student.studentProfile;
    if (before && before.revision !== input.revision) throw new AuthorizationError("STATE_CONFLICT", "O avatar foi atualizado em outra aba.");
    if (!before && input.revision !== 0) throw new AuthorizationError("STATE_CONFLICT", "O avatar foi atualizado em outra aba.");

    const next = before
      ? await tx.studentProfile.update({
        where: { studentId: student.id },
        data: { ...input.options, revision: { increment: 1 } },
        select: { skinTone: true, outfitColor: true, hairStyle: true, hairColor: true, revision: true },
      })
      : await tx.studentProfile.create({
        data: { studentId: student.id, ...input.options },
        select: { skinTone: true, outfitColor: true, hairStyle: true, hairColor: true, revision: true },
      });

    await tx.auditEvent.create({
      data: {
        actorId: student.id,
        schoolId: student.enrollments[0]?.schoolId ?? null,
        action: "STUDENT_AVATAR_UPDATED",
        targetType: "StudentProfile",
        targetId: student.id,
        correlationId: input.correlationId ?? randomUUID(),
        before: before ? { skinTone: before.skinTone, outfitColor: before.outfitColor, hairStyle: before.hairStyle, hairColor: before.hairColor, revision: before.revision } : Prisma.JsonNull,
        after: next,
      },
    });
    return next;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10_000, timeout: 20_000 });
}
