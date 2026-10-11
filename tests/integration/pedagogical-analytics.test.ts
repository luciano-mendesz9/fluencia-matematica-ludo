import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { hashPassword } from "../../src/server/auth/password";
import type { AuthenticatedPrincipal } from "../../src/server/auth/policies";
import { assertDatabaseMarker } from "../../src/server/database/marker";
import { readDatabaseEnvironment } from "../../src/server/database/environment";
import { getAuthorizedAnalytics, getStudentAnalytics } from "../../src/server/analytics/service";

const suffix = randomUUID();
const ids = { users: [] as string[], school: "", year: "", classes: [] as string[], activity: "", participations: [] as string[], games: [] as string[], questions: [] as string[], versions: [] as string[], theme: "", skill: "" };
let teacher: AuthenticatedPrincipal;
let hostileTeacher: AuthenticatedPrincipal;
let developer: AuthenticatedPrincipal;
let students: AuthenticatedPrincipal[] = [];

describe.sequential("FM-022 consultas pedagógicas autorizadas", () => {
  beforeAll(async () => {
    await assertDatabaseMarker(prisma, readDatabaseEnvironment().appEnvId);
    const passwordHash = await hashPassword("FM022-Teste-2026");
    const adults = await Promise.all([
      ["Professor Analytics", null],
      ["Professor Analytics Externo", null],
      ["Developer Analytics", "DEVELOPER"],
    ].map(([name, globalRole], index) => prisma.user.create({ data: { name: name!, email: `fm022-${index}-${suffix}@example.invalid`, normalizedEmail: `fm022-${index}-${suffix}@example.invalid`, passwordHash, globalRole: globalRole as "DEVELOPER" | null } })));
    [teacher, hostileTeacher, developer] = adults.map((user) => ({ id: user.id, name: user.name, globalRole: user.globalRole, studentCode: null }));
    const studentRows = await Promise.all(["Ana Analytics", "Bia Analytics"].map((name, index) => prisma.user.create({ data: { name, studentCode: `FM022-${index}-${suffix}`, passwordHash } })));
    students = studentRows.map((user) => ({ id: user.id, name: user.name, globalRole: null, studentCode: user.studentCode }));
    ids.users.push(...adults.map(({ id }) => id), ...studentRows.map(({ id }) => id));

    ids.school = (await prisma.school.create({ data: { name: "Escola FM022", externalCode: `FM022-${suffix}` } })).id;
    ids.year = (await prisma.academicYear.create({ data: { schoolId: ids.school, year: 2026 } })).id;
    ids.classes.push((await prisma.classGroup.create({ data: { schoolId: ids.school, academicYearId: ids.year, grade: 4, name: "Turma Analytics", normalizedName: `analytics-${suffix}` } })).id);
    ids.classes.push((await prisma.classGroup.create({ data: { schoolId: ids.school, academicYearId: ids.year, grade: 4, name: "Turma Externa", normalizedName: `externa-${suffix}` } })).id);
    const membership = await prisma.schoolMembership.create({ data: { userId: teacher.id, schoolId: ids.school, role: "TEACHER" } });
    await prisma.teacherClassAssignment.create({ data: { membershipId: membership.id, teacherId: teacher.id, schoolId: ids.school, classId: ids.classes[0]! } });
    const hostileMembership = await prisma.schoolMembership.create({ data: { userId: hostileTeacher.id, schoolId: ids.school, role: "TEACHER" } });
    await prisma.teacherClassAssignment.create({ data: { membershipId: hostileMembership.id, teacherId: hostileTeacher.id, schoolId: ids.school, classId: ids.classes[1]! } });

    const enrollments = await Promise.all(students.map((student) => prisma.enrollment.create({ data: { studentId: student.id, schoolId: ids.school, classId: ids.classes[0]! } })));
    ids.theme = (await prisma.theme.create({ data: { name: `Números FM022 ${suffix}`, normalizedName: `numeros-fm022-${suffix}` } })).id;
    ids.skill = (await prisma.skill.create({ data: { themeId: ids.theme, name: "Adição", normalizedName: `adicao-${suffix}` } })).id;
    for (let index = 0; index < 2; index += 1) {
      const question = await prisma.question.create({ data: { origin: "PRIVATE", ownerId: teacher.id, createdById: teacher.id } });
      ids.questions.push(question.id);
      const version = await prisma.questionVersion.create({ data: { questionId: question.id, versionNumber: 1, grade: 4, difficulty: 3, themeId: ids.theme, skillId: ids.skill, statement: `Questão ${index + 1}`, answerType: "NUMERIC", numericExpected: 10, contentHash: `${index + 1}`.padStart(64, "0"), createdById: teacher.id } });
      ids.versions.push(version.id);
    }
    ids.activity = (await prisma.activity.create({ data: { schoolId: ids.school, classId: ids.classes[0]!, teacherId: teacher.id, title: "Atividade Analytics", targetCount: 2, status: "OPEN", openedAt: new Date("2026-10-01T12:00:00Z") } })).id;
    await prisma.activityQuestionVersion.createMany({ data: ids.versions.map((questionVersionId) => ({ activityId: ids.activity, questionVersionId })) });
    for (let index = 0; index < students.length; index += 1) {
      const participation = await prisma.activityParticipation.create({ data: { activityId: ids.activity, enrollmentId: enrollments[index]!.id, studentId: students[index]!.id, acceptedAnswers: index === 0 ? 3 : 0, correctAnswers: index === 0 ? 1 : 0, incorrectAnswers: index === 0 ? 2 : 0, extraAnswers: index === 0 ? 1 : 0, targetReachedAt: index === 0 ? new Date("2026-10-10T12:00:00Z") : null } });
      ids.participations.push(participation.id);
    }
    const game = await prisma.gameSession.create({ data: { participationId: ids.participations[0]!, boardVersion: "fm022", rules: {}, pieces: [], phase: "RECOVERY_ROLL", errorCount: 2 } });
    ids.games.push(game.id);
    const attempts = [
      { version: ids.versions[0]!, correct: false, repeated: false, error: 0, extra: false },
      { version: ids.versions[1]!, correct: false, repeated: false, error: 1, extra: false },
      { version: ids.versions[1]!, correct: true, repeated: true, error: 2, extra: true },
    ];
    for (let index = 0; index < attempts.length; index += 1) {
      const item = attempts[index]!;
      const clientActionId = randomUUID();
      const acceptedAt = new Date(`2026-10-${10 + index}T12:00:00Z`);
      const challenge = await prisma.gameChallenge.create({ data: { gameId: game.id, questionVersionId: item.version, difficulty: 3, dice: 3, status: "ANSWERED", isRepeated: item.repeated, sessionRevision: index + 1, presentedAt: acceptedAt, answeredAt: acceptedAt } });
      await prisma.answerAttempt.create({ data: { challengeId: challenge.id, gameId: game.id, participationId: ids.participations[0]!, clientActionId, response: { value: `RESPOSTA-PRIVADA-${index}` }, outcome: item.correct ? "CORRECT" : "INCORRECT", errorStreakBefore: item.error, acceptedAt } });
      await prisma.activityAnswerReceipt.create({ data: { participationId: ids.participations[0]!, clientActionId, outcome: item.correct ? "CORRECT" : "INCORRECT", acceptedNumber: index + 1, isExtra: item.extra, acceptedAt } });
    }
  });

  afterAll(async () => {
    await prisma.answerAttempt.deleteMany({ where: { participationId: { in: ids.participations } } });
    await prisma.activityAnswerReceipt.deleteMany({ where: { participationId: { in: ids.participations } } });
    await prisma.gameChallenge.deleteMany({ where: { gameId: { in: ids.games } } });
    await prisma.gameSession.deleteMany({ where: { id: { in: ids.games } } });
    await prisma.activityParticipation.deleteMany({ where: { id: { in: ids.participations } } });
    await prisma.activityQuestionVersion.deleteMany({ where: { activityId: ids.activity } });
    await prisma.activity.deleteMany({ where: { id: ids.activity } });
    await prisma.questionVersion.deleteMany({ where: { id: { in: ids.versions } } });
    await prisma.question.deleteMany({ where: { id: { in: ids.questions } } });
    await prisma.skill.deleteMany({ where: { id: ids.skill } });
    await prisma.theme.deleteMany({ where: { id: ids.theme } });
    await prisma.enrollment.deleteMany({ where: { studentId: { in: ids.users } } });
    await prisma.teacherClassAssignment.deleteMany({ where: { teacherId: { in: ids.users } } });
    await prisma.schoolMembership.deleteMany({ where: { userId: { in: ids.users } } });
    await prisma.classGroup.deleteMany({ where: { id: { in: ids.classes } } });
    await prisma.academicYear.deleteMany({ where: { id: ids.year } });
    await prisma.school.deleteMany({ where: { id: ids.school } });
    await prisma.user.deleteMany({ where: { id: { in: ids.users } } });
    await prisma.$disconnect();
  });

  it("reconcilia respostas, distintas, repetições, recuperação e prática adicional com o banco", async () => {
    const result = await getAuthorizedAnalytics({ actor: teacher, filters: { schoolId: ids.school, classId: ids.classes[0] }, policy: { minimumDistinctQuestions: 2, reviewThresholdPercent: 50 } });
    expect(result.summary).toMatchObject({ recipients: 2, participants: 1, answers: 3, correct: 1, distinctQuestions: 2, repetitions: 1, recoveryAnswers: 2, extraAnswers: 1 });
    expect(result.feedback[0]).toMatchObject({ status: "REVIEW", answers: 3, correct: 1, distinctQuestions: 2 });
    const raw = await prisma.answerAttempt.aggregate({ where: { participationId: ids.participations[0] }, _count: true });
    expect(result.summary.answers).toBe(raw._count);
    expect(JSON.stringify(result)).not.toMatch(/RESPOSTA-PRIVADA|studentCode|normalizedEmail/i);
  });

  it("começa pelas turmas autorizadas e nega professor externo e desenvolvedor", async () => {
    await expect(getAuthorizedAnalytics({ actor: hostileTeacher, filters: { schoolId: ids.school, classId: ids.classes[0] } })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(getAuthorizedAnalytics({ actor: developer, filters: {} })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("isola a visão individual do aluno e mantém repetição como contexto", async () => {
    const result = await getStudentAnalytics({ actor: students[0]!, policy: { minimumDistinctQuestions: 2, reviewThresholdPercent: 50 } });
    expect(result.summary).toMatchObject({ answers: 3, repetitions: 1, distinctQuestions: 2 });
    expect(JSON.stringify(result)).not.toContain(students[1]!.name);
  });
});
