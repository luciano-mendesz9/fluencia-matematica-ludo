import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { hashPassword } from "../../src/server/auth/password";
import type { AuthenticatedPrincipal } from "../../src/server/auth/policies";
import { assertDatabaseMarker } from "../../src/server/database/marker";
import { readDatabaseEnvironment } from "../../src/server/database/environment";
import { getAuthorizedClassMonthlyRanking, getStudentMonthlyRanking } from "../../src/server/rankings/service";

const suffix = randomUUID();
const now = new Date("2026-10-15T12:00:00.000Z");
const userIds: string[] = [];
let schoolId = "";
let yearId = "";
let classA = "";
let classB = "";
let activityId = "";
let teacher: AuthenticatedPrincipal;
let coordinator: AuthenticatedPrincipal;
let hostileTeacher: AuthenticatedPrincipal;
let students: AuthenticatedPrincipal[] = [];

describe.sequential("FM-021 ranking mensal por turma", () => {
  beforeAll(async () => {
    await assertDatabaseMarker(prisma, readDatabaseEnvironment().appEnvId);
    const passwordHash = await hashPassword("FM021-Teste-2026");
    const adultRows = await Promise.all(["Professor Ranking", "Coordenação Ranking", "Professor Externo"].map((name, index) => prisma.user.create({ data: { name, email: `fm021-${index}-${suffix}@example.invalid`, normalizedEmail: `fm021-${index}-${suffix}@example.invalid`, passwordHash } })));
    [teacher, coordinator, hostileTeacher] = adultRows.map((user) => ({ id: user.id, name: user.name, globalRole: null, studentCode: null }));
    const studentRows = await Promise.all(["Ana Beatriz", "Bruno Lima", "Carla Souza", "Diego Alves"].map((name, index) => prisma.user.create({ data: { name, studentCode: `FM021-${index}-${suffix}`, passwordHash } })));
    students = studentRows.map((user) => ({ id: user.id, name: user.name, globalRole: null, studentCode: user.studentCode }));
    userIds.push(...adultRows.map(({ id }) => id), ...studentRows.map(({ id }) => id));

    const school = await prisma.school.create({ data: { name: "Escola FM021", externalCode: `FM021-${suffix}` } });
    schoolId = school.id;
    yearId = (await prisma.academicYear.create({ data: { schoolId, year: 2026 } })).id;
    classA = (await prisma.classGroup.create({ data: { schoolId, academicYearId: yearId, grade: 4, name: "Turma Azul", normalizedName: `azul-${suffix}` } })).id;
    classB = (await prisma.classGroup.create({ data: { schoolId, academicYearId: yearId, grade: 4, name: "Turma Branca", normalizedName: `branca-${suffix}` } })).id;

    const teacherMembership = await prisma.schoolMembership.create({ data: { userId: teacher.id, schoolId, role: "TEACHER" } });
    await prisma.teacherClassAssignment.create({ data: { membershipId: teacherMembership.id, teacherId: teacher.id, schoolId, classId: classA } });
    await prisma.schoolMembership.create({ data: { userId: coordinator.id, schoolId, role: "COORDINATOR" } });
    const hostileMembership = await prisma.schoolMembership.create({ data: { userId: hostileTeacher.id, schoolId, role: "TEACHER" } });
    await prisma.teacherClassAssignment.create({ data: { membershipId: hostileMembership.id, teacherId: hostileTeacher.id, schoolId, classId: classB } });

    const enrollments = [];
    for (const student of students.slice(0, 3)) enrollments.push(await prisma.enrollment.create({ data: { studentId: student.id, schoolId, classId: classA } }));
    const oldEnrollment = await prisma.enrollment.create({ data: { studentId: students[3]!.id, schoolId, classId: classA, status: "ENDED", startsAt: new Date("2026-01-01T03:00:00Z"), endsAt: new Date("2026-10-10T03:00:00Z") } });
    await prisma.enrollment.create({ data: { studentId: students[3]!.id, schoolId, classId: classB, startsAt: new Date("2026-10-10T03:00:01Z") } });

    activityId = (await prisma.activity.create({ data: { schoolId, classId: classA, teacherId: teacher.id, title: "Atividade Ranking", targetCount: 1, status: "OPEN", openedAt: now } })).id;
    const participationRows: { id: string }[] = [];
    for (let index = 0; index < students.length; index += 1) participationRows.push(await prisma.activityParticipation.create({ data: { activityId, enrollmentId: index === 3 ? oldEnrollment.id : enrollments[index]!.id, studentId: students[index]!.id } }));

    const award = async (studentIndex: number, amount: number, awardedAt: Date) => {
      const game = await prisma.gameSession.create({ data: { participationId: participationRows[studentIndex]!.id, status: "FINISHED", phase: "FINISHED", boardVersion: "fm021-test", rules: {}, pieces: [], finishedAt: awardedAt } });
      await prisma.pointEvent.create({ data: { participationId: participationRows[studentIndex]!.id, studentId: students[studentIndex]!.id, classId: classA, activityId, gameId: game.id, type: "VICTORY_BONUS", amount, awardedAt } });
    };
    await award(0, 50, new Date("2026-10-01T02:59:59.999Z"));
    await award(0, 10, new Date("2026-10-01T03:00:00.000Z"));
    await award(0, 99, new Date("2026-11-01T03:00:00.000Z"));
    await award(1, 10, new Date("2026-11-01T02:59:59.999Z"));
    await award(2, 4, new Date("2026-10-15T12:00:00.000Z"));
    await award(3, 30, new Date("2026-10-05T12:00:00.000Z"));
  });

  afterAll(async () => {
    await prisma.pointEvent.deleteMany({ where: { activityId } });
    await prisma.gameSession.deleteMany({ where: { participation: { activityId } } });
    await prisma.activityParticipation.deleteMany({ where: { activityId } });
    await prisma.activity.deleteMany({ where: { id: activityId } });
    await prisma.enrollment.deleteMany({ where: { studentId: { in: userIds } } });
    await prisma.teacherClassAssignment.deleteMany({ where: { teacherId: { in: userIds } } });
    await prisma.schoolMembership.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.classGroup.deleteMany({ where: { schoolId } });
    await prisma.academicYear.deleteMany({ where: { id: yearId } });
    await prisma.school.deleteMany({ where: { id: schoolId } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  });

  it("agrega o mês de Fortaleza, inclui zero e aplica empate 1/1/3 sem expor identificadores", async () => {
    const ranking = await getStudentMonthlyRanking({ actor: students[0]!, now });
    expect(ranking.entries).toEqual([
      { position: 1, name: "Ana Beatriz", points: 10, isCurrentStudent: true },
      { position: 1, name: "Bruno Lima", points: 10, isCurrentStudent: false },
      { position: 3, name: "Carla Souza", points: 4, isCurrentStudent: false },
    ]);
    expect(JSON.stringify(ranking)).not.toMatch(/studentCode|email|studentId|error/i);
  });

  it("mantém evento na turma histórica e inicia o novo mês visualmente em zero", async () => {
    const transferred = await getStudentMonthlyRanking({ actor: students[3]!, now });
    expect(transferred.classGroup.name).toBe("Turma Branca");
    expect(transferred.entries).toEqual([{ position: 1, name: "Diego Alves", points: 0, isCurrentStudent: true }]);
    const december = await getAuthorizedClassMonthlyRanking({ actor: coordinator, schoolId, classId: classA, now: new Date("2026-12-15T12:00:00Z") });
    expect(december.entries.every(({ points }) => points === 0)).toBe(true);
    expect(await prisma.pointEvent.count({ where: { activityId } })).toBe(6);
  });

  it("autoriza professor atribuído e coordenação, mas nega turma externa e aluno", async () => {
    await expect(getAuthorizedClassMonthlyRanking({ actor: teacher, schoolId, classId: classA, now })).resolves.toMatchObject({ classGroup: { name: "Turma Azul" } });
    await expect(getAuthorizedClassMonthlyRanking({ actor: coordinator, schoolId, classId: classA, now })).resolves.toMatchObject({ classGroup: { name: "Turma Azul" } });
    await expect(getAuthorizedClassMonthlyRanking({ actor: hostileTeacher, schoolId, classId: classA, now })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(getAuthorizedClassMonthlyRanking({ actor: students[0]!, schoolId, classId: classA, now })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(getAuthorizedClassMonthlyRanking({ actor: teacher, schoolId, classId: randomUUID(), now })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
