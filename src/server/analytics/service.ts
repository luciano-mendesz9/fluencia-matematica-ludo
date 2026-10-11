import "server-only";

import { summarizeAnalytics, type AnalyticsAnswer, type AnalyticsPolicy } from "@/src/domain/analytics";
import type { ReportQuery } from "@/src/domain/reports";
import { REPORT_MAX_PERIOD_DAYS } from "@/src/domain/reports";
import { prisma } from "@/src/lib/prisma";
import { AuthorizationError } from "@/src/server/auth/errors";
import type { AuthenticatedPrincipal } from "@/src/server/auth/policies";
import { isUuid } from "@/src/server/schools/management";

export type AnalyticsFilters = ReportQuery;

const activeAt = (now: Date) => ({
  status: "ACTIVE" as const,
  startsAt: { lte: now },
  OR: [{ endsAt: null }, { endsAt: { gt: now } }],
});

function configuredNumber(name: string, options: { integer?: boolean; min: number; max: number }) {
  const raw = process.env[name]?.trim();
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || (options.integer && !Number.isInteger(value)) || value < options.min || value > options.max) return null;
  return value;
}

export function configuredAnalyticsPolicy(): AnalyticsPolicy {
  return {
    minimumDistinctQuestions: configuredNumber("ANALYTICS_MIN_DISTINCT_QUESTIONS", { integer: true, min: 1, max: 100 }),
    reviewThresholdPercent: configuredNumber("ANALYTICS_REVIEW_THRESHOLD_PERCENT", { min: 1, max: 100 }),
  };
}

function validateFilters(filters: AnalyticsFilters) {
  for (const [label, value] of [["Escola", filters.schoolId], ["Turma", filters.classId], ["Atividade", filters.activityId], ["Aluno", filters.studentId], ["Habilidade", filters.skillId]] as const) {
    if (value && !isUuid(value)) throw new AuthorizationError("NOT_FOUND", `${label} não encontrado(a).`);
  }
  if (filters.difficulty !== undefined && (!Number.isInteger(filters.difficulty) || filters.difficulty < 1 || filters.difficulty > 6)) {
    throw new AuthorizationError("VALIDATION", "Dificuldade inválida.");
  }
  if (filters.from && Number.isNaN(filters.from.getTime())) throw new AuthorizationError("VALIDATION", "Data inicial inválida.");
  if (filters.to && Number.isNaN(filters.to.getTime())) throw new AuthorizationError("VALIDATION", "Data final inválida.");
  if (filters.from && filters.to && filters.from >= filters.to) throw new AuthorizationError("VALIDATION", "A data final deve ser posterior à inicial.");
  if (filters.from && filters.to && filters.to.getTime() - filters.from.getTime() > REPORT_MAX_PERIOD_DAYS * 86_400_000) {
    throw new AuthorizationError("VALIDATION", `O período máximo do relatório é de ${REPORT_MAX_PERIOD_DAYS} dias.`);
  }
}

async function authorizedScope(input: { actor: AuthenticatedPrincipal; filters: AnalyticsFilters; now: Date }) {
  const { actor, filters, now } = input;
  if (actor.studentCode) throw new AuthorizationError("FORBIDDEN", "Use a visão individual do aluno.");
  if (actor.globalRole === "DEVELOPER") throw new AuthorizationError("FORBIDDEN", "Dados pedagógicos individuais não estão disponíveis para operação técnica.");

  if (actor.globalRole === "SEMED_ADMIN") {
    const classes = await prisma.classGroup.findMany({
      where: {
        ...(filters.schoolId ? { schoolId: filters.schoolId } : {}),
        status: "ACTIVE",
        school: { status: "ACTIVE" },
        academicYear: { status: "ACTIVE" },
      },
      select: { id: true, schoolId: true, name: true, grade: true, school: { select: { name: true } } },
      orderBy: [{ school: { name: "asc" } }, { name: "asc" }],
    });
    return { kind: "NETWORK" as const, classRows: classes, schoolId: filters.schoolId };
  }

  if (!filters.schoolId) throw new AuthorizationError("VALIDATION", "Selecione uma escola.");
  const membership = await prisma.schoolMembership.findFirst({
    where: { userId: actor.id, schoolId: filters.schoolId, role: { in: ["COORDINATOR", "TEACHER"] }, ...activeAt(now), school: { status: "ACTIVE" } },
    select: { id: true, role: true },
  });
  if (!membership) throw new AuthorizationError("FORBIDDEN", "Vínculo escolar não autorizado.");
  const classes = await prisma.classGroup.findMany({
    where: {
      schoolId: filters.schoolId,
      status: "ACTIVE",
      academicYear: { status: "ACTIVE" },
      ...(membership.role === "TEACHER" ? { teacherAssignments: { some: { membershipId: membership.id, teacherId: actor.id, ...activeAt(now) } } } : {}),
    },
    select: { id: true, schoolId: true, name: true, grade: true, school: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
  return { kind: membership.role as "COORDINATOR" | "TEACHER", classRows: classes, schoolId: filters.schoolId };
}

function dateWhere(filters: AnalyticsFilters) {
  return filters.from || filters.to ? { acceptedAt: { ...(filters.from ? { gte: filters.from } : {}), ...(filters.to ? { lt: filters.to } : {}) } } : {};
}

export async function getAuthorizedAnalytics(input: {
  actor: AuthenticatedPrincipal;
  filters: AnalyticsFilters;
  policy?: AnalyticsPolicy;
  now?: Date;
}) {
  validateFilters(input.filters);
  const now = input.now ?? new Date();
  const scope = await authorizedScope({ actor: input.actor, filters: input.filters, now });
  const allowedClassIds = scope.classRows.map((item) => item.id);
  if (input.filters.classId && !allowedClassIds.includes(input.filters.classId)) throw new AuthorizationError("FORBIDDEN", "Turma não autorizada.");
  const classIds = input.filters.classId ? [input.filters.classId] : allowedClassIds;

  const activities = classIds.length ? await prisma.activity.findMany({
    where: { classId: { in: classIds }, ...(input.filters.activityId ? { id: input.filters.activityId } : {}) },
    select: { id: true, title: true, classId: true, status: true, classGroup: { select: { name: true } } },
    orderBy: [{ createdAt: "desc" }],
  }) : [];
  if (input.filters.activityId && activities.length === 0) throw new AuthorizationError("FORBIDDEN", "Atividade não autorizada.");
  const activityIds = activities.map((item) => item.id);

  const participations = activityIds.length ? await prisma.activityParticipation.findMany({
    where: {
      activityId: { in: activityIds },
      ...(input.filters.studentId ? { studentId: input.filters.studentId } : {}),
    },
    select: {
      id: true,
      activityId: true,
      studentId: true,
      targetReachedAt: true,
      student: { select: { name: true } },
      answerReceipts: { select: { clientActionId: true, isExtra: true } },
      answerAttempts: {
        where: {
          ...dateWhere(input.filters),
          ...(input.filters.difficulty || input.filters.skillId ? { challenge: {
            ...(input.filters.difficulty ? { difficulty: input.filters.difficulty } : {}),
            ...(input.filters.skillId ? { questionVersion: { skillId: input.filters.skillId } } : {}),
          } } : {}),
        },
        select: {
          clientActionId: true,
          outcome: true,
          errorStreakBefore: true,
          acceptedAt: true,
          challenge: {
            select: {
              isRepeated: true,
              difficulty: true,
              questionVersionId: true,
              questionVersion: { select: { theme: { select: { name: true } }, skill: { select: { id: true, name: true } } } },
            },
          },
        },
      },
    },
    orderBy: { student: { name: "asc" } },
  }) : [];
  if (input.filters.studentId && participations.length === 0) throw new AuthorizationError("FORBIDDEN", "Aluno não autorizado.");

  const answers: AnalyticsAnswer[] = participations.flatMap((participation) => {
    const extraByAction = new Map(participation.answerReceipts.map((receipt) => [receipt.clientActionId, receipt.isExtra]));
    return participation.answerAttempts.map((attempt) => ({
      participationId: participation.id,
      activityId: participation.activityId,
      studentId: participation.studentId,
      studentName: participation.student.name,
      questionVersionId: attempt.challenge.questionVersionId,
      themeName: attempt.challenge.questionVersion.theme.name,
      skillId: attempt.challenge.questionVersion.skill?.id ?? null,
      skillName: attempt.challenge.questionVersion.skill?.name ?? null,
      difficulty: attempt.challenge.difficulty,
      acceptedAt: attempt.acceptedAt,
      correct: attempt.outcome === "CORRECT",
      repeated: attempt.challenge.isRepeated,
      extra: extraByAction.get(attempt.clientActionId) ?? false,
      recovery: attempt.errorStreakBefore > 0,
    }));
  });
  const analytics = summarizeAnalytics({
    recipients: participations.map((participation) => ({
      participationId: participation.id,
      activityId: participation.activityId,
      studentId: participation.studentId,
      studentName: participation.student.name,
      targetReachedAt: participation.targetReachedAt
        && (!input.filters.from || participation.targetReachedAt >= input.filters.from)
        && (!input.filters.to || participation.targetReachedAt < input.filters.to)
        ? participation.targetReachedAt
        : null,
    })),
    answers,
    policy: input.policy ?? configuredAnalyticsPolicy(),
  });
  const skills = await prisma.skill.findMany({
    where: { versions: { some: { gameChallenges: { some: { game: { participation: { activityId: { in: activityIds } } } } } } } },
    select: { id: true, name: true, theme: { select: { name: true } } },
    orderBy: [{ theme: { name: "asc" } }, { name: "asc" }],
  });
  const pointAggregate = classIds.length && activityIds.length ? await prisma.pointEvent.aggregate({
    where: {
      classId: { in: classIds },
      activityId: { in: activityIds },
      ...(input.filters.studentId ? { studentId: input.filters.studentId } : {}),
      ...(input.filters.from || input.filters.to ? { awardedAt: { ...(input.filters.from ? { gte: input.filters.from } : {}), ...(input.filters.to ? { lt: input.filters.to } : {}) } } : {}),
      ...(input.filters.difficulty || input.filters.skillId ? { answerAttempt: { is: { challenge: {
        ...(input.filters.difficulty ? { difficulty: input.filters.difficulty } : {}),
        ...(input.filters.skillId ? { questionVersion: { skillId: input.filters.skillId } } : {}),
      } } } } : {}),
    },
    _count: true,
    _sum: { amount: true },
  }) : null;

  return {
    scope: scope.kind,
    policy: input.policy ?? configuredAnalyticsPolicy(),
    filters: input.filters,
    options: {
      classes: scope.classRows.map(({ id, schoolId, name, grade, school }) => ({ id, schoolId, name, grade, schoolName: school.name })),
      activities,
      students: participations.map((item) => ({ id: item.studentId, name: item.student.name })).filter((item, index, all) => all.findIndex((other) => other.id === item.id) === index),
      skills,
    },
    points: { events: pointAggregate?._count ?? 0, total: pointAggregate?._sum.amount ?? 0 },
    ...analytics,
  };
}

export async function getStudentAnalytics(input: { actor: AuthenticatedPrincipal; policy?: AnalyticsPolicy }) {
  if (!input.actor.studentCode || input.actor.globalRole) throw new AuthorizationError("FORBIDDEN", "Acesso exclusivo do aluno.");
  const participations = await prisma.activityParticipation.findMany({
    where: { studentId: input.actor.id },
    select: {
      id: true,
      activityId: true,
      studentId: true,
      targetReachedAt: true,
      student: { select: { name: true } },
      answerReceipts: { select: { clientActionId: true, isExtra: true } },
      answerAttempts: { select: { clientActionId: true, outcome: true, errorStreakBefore: true, acceptedAt: true, challenge: { select: { isRepeated: true, difficulty: true, questionVersionId: true, questionVersion: { select: { theme: { select: { name: true } }, skill: { select: { id: true, name: true } } } } } } } },
    },
  });
  const answers: AnalyticsAnswer[] = participations.flatMap((participation) => {
    const extraByAction = new Map(participation.answerReceipts.map((receipt) => [receipt.clientActionId, receipt.isExtra]));
    return participation.answerAttempts.map((attempt) => ({ participationId: participation.id, activityId: participation.activityId, studentId: participation.studentId, studentName: participation.student.name, questionVersionId: attempt.challenge.questionVersionId, themeName: attempt.challenge.questionVersion.theme.name, skillId: attempt.challenge.questionVersion.skill?.id ?? null, skillName: attempt.challenge.questionVersion.skill?.name ?? null, difficulty: attempt.challenge.difficulty, acceptedAt: attempt.acceptedAt, correct: attempt.outcome === "CORRECT", repeated: attempt.challenge.isRepeated, extra: extraByAction.get(attempt.clientActionId) ?? false, recovery: attempt.errorStreakBefore > 0 }));
  });
  return summarizeAnalytics({ recipients: participations.map((item) => ({ participationId: item.id, activityId: item.activityId, studentId: item.studentId, studentName: item.student.name, targetReachedAt: item.targetReachedAt })), answers, policy: input.policy ?? configuredAnalyticsPolicy() });
}
