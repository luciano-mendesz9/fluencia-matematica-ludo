import "server-only";

export { percentage, performanceLabel } from "@/src/domain/management";
import { percentage, performanceLabel } from "@/src/domain/management";
import { prisma } from "@/src/lib/prisma";
import { AuthorizationError } from "@/src/server/auth/errors";
import { assertGlobalRole, type AuthenticatedPrincipal } from "@/src/server/auth/policies";
import { resolveActiveClassAssignment } from "@/src/server/people/service";
import { authorizeSchoolManager, isUuid } from "@/src/server/schools/management";

const activeAt = (now: Date) => ({
  status: "ACTIVE" as const,
  startsAt: { lte: now },
  OR: [{ endsAt: null }, { endsAt: { gt: now } }],
});

export async function getTeacherManagementOverview(input: {
  actor: AuthenticatedPrincipal;
  schoolId: string;
  now?: Date;
}) {
  if (input.actor.globalRole || input.actor.studentCode || !isUuid(input.schoolId)) {
    throw new AuthorizationError("FORBIDDEN", "Acesso não autorizado.");
  }
  const now = input.now ?? new Date();
  const membership = await prisma.schoolMembership.findFirst({
    where: { userId: input.actor.id, schoolId: input.schoolId, role: "TEACHER", ...activeAt(now), school: { status: "ACTIVE" } },
    select: { id: true },
  });
  if (!membership) throw new AuthorizationError("FORBIDDEN", "Vínculo escolar não autorizado.");
  const assignments = await prisma.teacherClassAssignment.findMany({
    where: { membershipId: membership.id, teacherId: input.actor.id, schoolId: input.schoolId, ...activeAt(now), classGroup: { status: "ACTIVE", academicYear: { status: "ACTIVE" } } },
    select: {
      id: true,
      classId: true,
      classGroup: {
        select: {
          name: true,
          grade: true,
          academicYear: { select: { year: true } },
          enrollments: { where: activeAt(now), select: { id: true } },
        },
      },
    },
    orderBy: [{ classGroup: { grade: "asc" } }, { classGroup: { name: "asc" } }],
  });
  const classIds = assignments.map((item) => item.classId);
  const activities = classIds.length ? await prisma.activity.findMany({
    where: { teacherId: input.actor.id, schoolId: input.schoolId, classId: { in: classIds } },
    select: {
      id: true,
      title: true,
      status: true,
      targetCount: true,
      openedAt: true,
      closedAt: true,
      updatedAt: true,
      classGroup: { select: { id: true, name: true } },
      participations: { select: { studentId: true, acceptedAnswers: true, correctAnswers: true, targetReachedAt: true } },
    },
    orderBy: { updatedAt: "desc" },
  }) : [];
  const activityRows = activities.map((activity) => {
    const answers = activity.participations.reduce((sum, item) => sum + item.acceptedAnswers, 0);
    const correct = activity.participations.reduce((sum, item) => sum + item.correctAnswers, 0);
    const participants = activity.participations.filter((item) => item.acceptedAnswers > 0).length;
    const targetReached = activity.participations.filter((item) => item.targetReachedAt).length;
    return {
      ...activity,
      answers,
      correct,
      participants,
      targetReached,
      recipients: activity.participations.length,
      participationPercent: percentage(participants, activity.participations.length),
      precisionPercent: percentage(correct, answers),
    };
  });
  const studentIdsNeedingAttention = new Set<string>();
  for (const activity of activities.filter((item) => item.status === "OPEN")) {
    activity.participations
      .filter((row) => row.acceptedAnswers < activity.targetCount)
      .forEach((row) => studentIdsNeedingAttention.add(row.studentId));
  }
  return {
    assignments,
    activities: activityRows,
    summary: {
      classes: assignments.length,
      students: assignments.reduce((sum, item) => sum + item.classGroup.enrollments.length, 0),
      openActivities: activities.filter((item) => item.status === "OPEN").length,
      drafts: activities.filter((item) => item.status === "DRAFT").length,
      studentsNeedingAttention: studentIdsNeedingAttention.size,
    },
  };
}

export async function getTeacherClassManagement(input: {
  actor: AuthenticatedPrincipal;
  schoolId: string;
  classId: string;
  now?: Date;
}) {
  if (!isUuid(input.schoolId) || !isUuid(input.classId)) throw new AuthorizationError("NOT_FOUND", "Turma não encontrada.");
  const assignment = await resolveActiveClassAssignment({ teacherId: input.actor.id, classId: input.classId });
  if (!assignment || assignment.schoolId !== input.schoolId || input.actor.globalRole || input.actor.studentCode) {
    throw new AuthorizationError("FORBIDDEN", "Turma não autorizada.");
  }
  const now = input.now ?? new Date();
  const group = await prisma.classGroup.findFirst({
    where: { id: input.classId, schoolId: input.schoolId, status: "ACTIVE", academicYear: { status: "ACTIVE" } },
    select: { id: true, name: true, grade: true, academicYear: { select: { year: true } } },
  });
  if (!group) throw new AuthorizationError("NOT_FOUND", "Turma não encontrada.");
  const [enrollments, activities] = await Promise.all([
    prisma.enrollment.findMany({
      where: { classId: input.classId, schoolId: input.schoolId, ...activeAt(now), student: { status: "ACTIVE", studentCode: { not: null } } },
      select: { id: true, student: { select: { id: true, name: true, status: true } } },
      orderBy: { student: { name: "asc" } },
    }),
    prisma.activity.findMany({
      where: { classId: input.classId, schoolId: input.schoolId, teacherId: input.actor.id },
      select: { id: true, title: true, status: true, targetCount: true, updatedAt: true, participations: { select: { studentId: true, acceptedAnswers: true, correctAnswers: true, incorrectAnswers: true, targetReachedAt: true } } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);
  const students = enrollments.map(({ student }) => {
    const participations = activities.flatMap((activity) => activity.participations
      .filter((item) => item.studentId === student.id)
      .map((item) => ({ ...item, activityId: activity.id, activityStatus: activity.status })));
    const answers = participations.reduce((sum, item) => sum + item.acceptedAnswers, 0);
    const correct = participations.reduce((sum, item) => sum + item.correctAnswers, 0);
    const incorrect = participations.reduce((sum, item) => sum + item.incorrectAnswers, 0);
    const respondedActivities = participations.filter((item) => item.acceptedAnswers > 0).length;
    const targetsReached = participations.filter((item) => item.targetReachedAt).length;
    const precisionPercent = percentage(correct, answers);
    return {
      ...student,
      answers,
      correct,
      incorrect,
      respondedActivities,
      pendingActivities: activities.filter((item) => item.status === "OPEN").length - participations.filter((item) => item.acceptedAnswers > 0 && item.activityStatus === "OPEN").length,
      targetsReached,
      precisionPercent,
      performance: performanceLabel(precisionPercent, answers),
    };
  });
  const totalAnswers = students.reduce((sum, item) => sum + item.answers, 0);
  const totalCorrect = students.reduce((sum, item) => sum + item.correct, 0);
  return {
    group,
    students,
    activities: activities.map(({ participations, ...activity }) => ({ ...activity, recipients: participations.length, participants: participations.filter((item) => item.acceptedAnswers > 0).length })),
    summary: {
      students: students.length,
      activities: activities.length,
      openActivities: activities.filter((item) => item.status === "OPEN").length,
      participationPercent: percentage(students.filter((item) => item.respondedActivities > 0).length, students.length),
      precisionPercent: percentage(totalCorrect, totalAnswers),
      answers: totalAnswers,
    },
  };
}

export async function getSchoolAdministrativeOverview(input: { actor: AuthenticatedPrincipal; schoolId: string; now?: Date }) {
  await authorizeSchoolManager(prisma, input.actor, input.schoolId);
  const now = input.now ?? new Date();
  const [classes, students, memberships, assignments] = await Promise.all([
    prisma.classGroup.findMany({ where: { schoolId: input.schoolId }, select: { id: true, grade: true, name: true, status: true, academicYear: { select: { year: true, status: true } }, _count: { select: { enrollments: { where: activeAt(now) } } } }, orderBy: [{ grade: "asc" }, { name: "asc" }] }),
    prisma.user.count({ where: { studentCode: { not: null }, enrollments: { some: { schoolId: input.schoolId, ...activeAt(now) } } } }),
    prisma.schoolMembership.findMany({ where: { schoolId: input.schoolId }, select: { id: true, role: true, status: true, startsAt: true, endsAt: true, user: { select: { status: true } } } }),
    prisma.teacherClassAssignment.count({ where: { schoolId: input.schoolId, ...activeAt(now) } }),
  ]);
  const activeMemberships = memberships.filter((item) => item.status === "ACTIVE" && item.startsAt <= now && (!item.endsAt || item.endsAt > now));
  return {
    classes,
    summary: {
      activeClasses: classes.filter((item) => item.status === "ACTIVE" && item.academicYear.status === "ACTIVE").length,
      students,
      teachers: activeMemberships.filter((item) => item.role === "TEACHER").length,
      coordinators: activeMemberships.filter((item) => item.role === "COORDINATOR").length,
      inactiveAccounts: activeMemberships.filter((item) => item.user.status === "BLOCKED").length,
      teacherAssignments: assignments,
      classesWithoutStudents: classes.filter((item) => item.status === "ACTIVE" && item._count.enrollments === 0).length,
    },
  };
}

export async function getNetworkAdministrativeOverview(actor: AuthenticatedPrincipal, now = new Date()) {
  assertGlobalRole(actor, ["SEMED_ADMIN"]);
  const schools = await prisma.school.findMany({
    select: {
      id: true,
      name: true,
      status: true,
      classGroups: { where: { status: "ACTIVE", academicYear: { status: "ACTIVE" } }, select: { id: true } },
      enrollments: { where: activeAt(now), select: { id: true } },
      memberships: { where: activeAt(now), select: { id: true, role: true, user: { select: { status: true } } } },
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
  const rows = schools.map((school) => ({
    id: school.id,
    name: school.name,
    status: school.status,
    classes: school.classGroups.length,
    students: school.enrollments.length,
    teachers: school.memberships.filter((item) => item.role === "TEACHER").length,
    coordinators: school.memberships.filter((item) => item.role === "COORDINATOR").length,
    blockedAdults: school.memberships.filter((item) => item.user.status === "BLOCKED").length,
  }));
  return {
    schools: rows,
    summary: {
      schools: rows.length,
      activeSchools: rows.filter((item) => item.status === "ACTIVE").length,
      classes: rows.reduce((sum, item) => sum + item.classes, 0),
      students: rows.reduce((sum, item) => sum + item.students, 0),
      teachers: rows.reduce((sum, item) => sum + item.teachers, 0),
      pending: rows.reduce((sum, item) => sum + item.blockedAdults, 0),
    },
  };
}
