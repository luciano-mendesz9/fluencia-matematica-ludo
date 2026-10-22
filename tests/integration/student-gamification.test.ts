import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { hashPassword } from "../../src/server/auth/password";
import type { AuthenticatedPrincipal } from "../../src/server/auth/policies";
import { assertDatabaseMarker } from "../../src/server/database/marker";
import { readDatabaseEnvironment } from "../../src/server/database/environment";
import { getStudentGamification, listStudentMinigames, updateStudentAvatar } from "../../src/server/gamification/service";

const suffix = randomUUID();
const now = new Date("2026-10-22T15:00:00.000Z");
const userIds: string[] = [];
let schoolId = "";
let yearId = "";
let classId = "";
let activityId = "";
let gameId = "";
let student: AuthenticatedPrincipal;
let peer: AuthenticatedPrincipal;
let teacher: AuthenticatedPrincipal;

describe.sequential("FM-028 patentes, conquistas, vitrine e avatar", () => {
  beforeAll(async () => {
    await assertDatabaseMarker(prisma, readDatabaseEnvironment().appEnvId);
    const passwordHash = await hashPassword("FM028-Teste-2026");
    const teacherRow = await prisma.user.create({ data: { name: "Professor FM028", email: `fm028-${suffix}@example.invalid`, normalizedEmail: `fm028-${suffix}@example.invalid`, passwordHash } });
    const studentRows = await Promise.all(["Aluno Herói", "Aluno Colega"].map((name, index) => prisma.user.create({ data: { name, studentCode: `FM028-${index}-${suffix}`, passwordHash } })));
    teacher = { id: teacherRow.id, name: teacherRow.name, globalRole: null, studentCode: null };
    [student, peer] = studentRows.map((row) => ({ id: row.id, name: row.name, globalRole: null, studentCode: row.studentCode }));
    userIds.push(teacherRow.id, ...studentRows.map((row) => row.id));

    const school = await prisma.school.create({ data: { name: "Escola FM028", externalCode: `FM028-${suffix}` } });
    schoolId = school.id;
    yearId = (await prisma.academicYear.create({ data: { schoolId, year: 2026 } })).id;
    classId = (await prisma.classGroup.create({ data: { schoolId, academicYearId: yearId, grade: 4, name: "Turma Gamificada", normalizedName: `gamificada-${suffix}` } })).id;
    const enrollments = await Promise.all(studentRows.map((row) => prisma.enrollment.create({ data: { studentId: row.id, schoolId, classId, startsAt: now } })));
    const ludo = await prisma.minigame.findUniqueOrThrow({ where: { slug: "ludo" } });
    activityId = (await prisma.activity.create({ data: { schoolId, classId, teacherId: teacher.id, minigameId: ludo.id, title: "Missão Ludo FM028", targetCount: 3, status: "OPEN", openedAt: now } })).id;
    const participation = await prisma.activityParticipation.create({ data: { activityId, enrollmentId: enrollments[0]!.id, studentId: student.id, pointsBalance: 100 } });
    gameId = (await prisma.gameSession.create({ data: { participationId: participation.id, status: "FINISHED", phase: "FINISHED", boardVersion: "fm028", rules: {}, pieces: [], pointsEarned: 100, finishedAt: now } })).id;
    await prisma.pointEvent.create({ data: { participationId: participation.id, studentId: student.id, classId, activityId, gameId, type: "VICTORY_BONUS", amount: 100, awardedAt: now } });
  });

  afterAll(async () => {
    await prisma.studentAchievement.deleteMany({ where: { studentId: { in: userIds } } });
    await prisma.studentProfile.deleteMany({ where: { studentId: { in: userIds } } });
    await prisma.pointEvent.deleteMany({ where: { activityId } });
    await prisma.gameSession.deleteMany({ where: { id: gameId } });
    await prisma.activityParticipation.deleteMany({ where: { activityId } });
    await prisma.activity.deleteMany({ where: { id: activityId } });
    await prisma.auditEvent.deleteMany({ where: { actorId: { in: userIds } } });
    await prisma.enrollment.deleteMany({ where: { studentId: { in: userIds } } });
    await prisma.classGroup.deleteMany({ where: { id: classId } });
    await prisma.academicYear.deleteMany({ where: { id: yearId } });
    await prisma.school.deleteMany({ where: { id: schoolId } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  });

  it("carrega exatamente dez patentes e posiciona Prata no nível 1", async () => {
    const ranks = await prisma.studentRank.findMany({ orderBy: { level: "asc" } });
    expect(ranks).toHaveLength(10);
    expect(ranks[0]).toMatchObject({ code: "BRONZE", name: "Bronze", level: 0, xpRequired: 0 });
    expect(ranks[1]).toMatchObject({ code: "SILVER", name: "Prata", level: 1, xpRequired: 50 });
    expect(ranks.slice(1).every((rank) => rank.xpRequired === 50)).toBe(true);
  });

  it("deriva XP e patente do ledger e persiste conquistas sem duplicar", async () => {
    const first = await getStudentGamification({ actor: student, now });
    expect(first).toMatchObject({ totalXp: 100, rankingPosition: 1, rank: { current: { name: "Ouro", level: 2 } } });
    expect(first.achievements.filter((item) => item.unlocked).map((item) => item.code)).toEqual(expect.arrayContaining(["FIRST_PODIUM", "SUPERSTAR", "CLASS_LEGEND"]));
    const count = await prisma.studentAchievement.count({ where: { studentId: student.id } });
    await getStudentGamification({ actor: student, now });
    expect(await prisma.studentAchievement.count({ where: { studentId: student.id } })).toBe(count);
  });

  it("exibe somente Ludo e Corrida Matemática e libera o Ludo da atividade do aluno", async () => {
    const games = await listStudentMinigames({ actor: student, now });
    expect(games.map((game) => game.slug)).toEqual(["ludo", "math-race"]);
    expect(games.find((game) => game.slug === "ludo")).toMatchObject({ unlocked: true, mission: { activityId } });
    expect(games.find((game) => game.slug === "math-race")).toMatchObject({ name: "Corrida Matemática", unlocked: false, comingSoon: true, mission: null });
    const peerGames = await listStudentMinigames({ actor: peer, now });
    expect(peerGames.find((game) => game.slug === "ludo")).toMatchObject({ unlocked: false, mission: null });
  });

  it("salva apenas o próprio avatar, audita e rejeita revisão antiga ou adulto", async () => {
    const updated = await updateStudentAvatar({ actor: student, revision: 0, options: { skinTone: "deep", outfitColor: "coral", hairStyle: "braids", hairColor: "auburn" } });
    expect(updated).toMatchObject({ skinTone: "deep", outfitColor: "coral", hairStyle: "braids", hairColor: "auburn", revision: 1 });
    await expect(updateStudentAvatar({ actor: student, revision: 0, options: { skinTone: "light", outfitColor: "ocean", hairStyle: "short", hairColor: "dark" } })).rejects.toMatchObject({ code: "STATE_CONFLICT" });
    await expect(updateStudentAvatar({ actor: teacher, revision: 0, options: { skinTone: "light", outfitColor: "ocean", hairStyle: "short", hairColor: "dark" } })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await prisma.auditEvent.count({ where: { actorId: student.id, action: "STUDENT_AVATAR_UPDATED" } })).toBe(1);
  });
});
