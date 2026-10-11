import "server-only";

import { currentMonthRange, rankStudents } from "@/src/domain/ranking";
import { prisma } from "@/src/lib/prisma";
import { AuthorizationError } from "@/src/server/auth/errors";
import type { AuthenticatedPrincipal } from "@/src/server/auth/policies";
import { isUuid } from "@/src/server/schools/management";

const activeAt = (now: Date) => ({ status: "ACTIVE" as const, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] });

async function rankingForClass(input: { classId: string; now: Date; currentStudentId?: string }) {
  const month = currentMonthRange(input.now);
  const enrollments = await prisma.enrollment.findMany({
    where: {
      classId: input.classId,
      ...activeAt(input.now),
      student: { status: "ACTIVE", studentCode: { not: null }, globalRole: null },
    },
    select: { studentId: true, student: { select: { name: true } } },
  });
  const studentIds = enrollments.map(({ studentId }) => studentId);
  const totals = studentIds.length === 0 ? [] : await prisma.pointEvent.groupBy({
    by: ["studentId"],
    where: { classId: input.classId, studentId: { in: studentIds }, awardedAt: { gte: month.start, lt: month.end } },
    _sum: { amount: true },
  });
  return {
    monthLabel: month.label,
    timeZone: month.timeZone,
    entries: rankStudents(
      enrollments.map(({ studentId, student }) => ({ id: studentId, name: student.name })),
      totals.map((total) => ({ studentId: total.studentId, points: total._sum.amount ?? 0 })),
      input.currentStudentId,
    ),
  };
}

export async function getStudentMonthlyRanking(input: { actor: AuthenticatedPrincipal; now?: Date }) {
  if (!input.actor.studentCode || input.actor.globalRole) throw new AuthorizationError("FORBIDDEN", "Acesso não autorizado.");
  const now = input.now ?? new Date();
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId: input.actor.id,
      ...activeAt(now),
      student: { status: "ACTIVE" },
      school: { status: "ACTIVE" },
      classGroup: { status: "ACTIVE", academicYear: { status: "ACTIVE" } },
    },
    select: { classId: true, classGroup: { select: { name: true, grade: true } } },
    orderBy: { startsAt: "desc" },
  });
  if (!enrollment) throw new AuthorizationError("FORBIDDEN", "Matrícula ativa não encontrada.");
  return {
    classGroup: enrollment.classGroup,
    ...(await rankingForClass({ classId: enrollment.classId, now, currentStudentId: input.actor.id })),
  };
}

export async function getAuthorizedClassMonthlyRanking(input: { actor: AuthenticatedPrincipal; schoolId: string; classId: string; now?: Date }) {
  if (!isUuid(input.schoolId) || !isUuid(input.classId)) throw new AuthorizationError("NOT_FOUND", "Turma não encontrada.");
  if (input.actor.globalRole || input.actor.studentCode) throw new AuthorizationError("FORBIDDEN", "Acesso não autorizado.");
  const now = input.now ?? new Date();
  const membership = await prisma.schoolMembership.findFirst({
    where: { userId: input.actor.id, schoolId: input.schoolId, role: { in: ["COORDINATOR", "TEACHER"] }, ...activeAt(now), school: { status: "ACTIVE" } },
    select: { id: true, role: true },
  });
  if (!membership) throw new AuthorizationError("FORBIDDEN", "Vínculo escolar não autorizado.");
  const classGroup = await prisma.classGroup.findFirst({
    where: { id: input.classId, schoolId: input.schoolId, status: "ACTIVE", academicYear: { status: "ACTIVE" } },
    select: { name: true, grade: true, academicYear: { select: { year: true } } },
  });
  if (!classGroup) throw new AuthorizationError("NOT_FOUND", "Turma não encontrada.");
  if (membership.role === "TEACHER") {
    const assignment = await prisma.teacherClassAssignment.findFirst({
      where: { membershipId: membership.id, teacherId: input.actor.id, schoolId: input.schoolId, classId: input.classId, ...activeAt(now) },
      select: { id: true },
    });
    if (!assignment) throw new AuthorizationError("FORBIDDEN", "Atribuição de turma não autorizada.");
  }
  return { classGroup, ...(await rankingForClass({ classId: input.classId, now })) };
}
