import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PieceState } from "../../src/domain/ludo";
import { Prisma } from "../../src/generated/prisma/client";
import { prisma } from "../../src/lib/prisma";
import { closeActivity } from "../../src/server/activities/service";
import { hashPassword } from "../../src/server/auth/password";
import type { AuthenticatedPrincipal } from "../../src/server/auth/policies";
import { assertDatabaseMarker } from "../../src/server/database/marker";
import { readDatabaseEnvironment } from "../../src/server/database/environment";
import { getGameSession, rollGame, startOrResumeGame, type RandomInt } from "../../src/server/games/service";
import { getAuthorizedMedia } from "../../src/server/questions/content-service";

const suffix = randomUUID();
const userIds: string[] = [];
const questionIds: string[] = [];
const versionIds: string[] = [];
const enrollmentIds: string[] = [];
let schoolId = "";
let yearId = "";
let classId = "";
let membershipId = "";
let assignmentId = "";
let themeId = "";
let activityId = "";
let difficultyTwoQuestionId = "";
let mediaId = "";
let teacher: AuthenticatedPrincipal;
let students: AuthenticatedPrincipal[] = [];

function sequence(...values: number[]): RandomInt {
  let index = 0;
  return (upperExclusive) => {
    const value = values[index++] ?? 0;
    if (value >= upperExclusive) throw new Error(`Valor ${value} fora de ${upperExclusive}.`);
    return value;
  };
}

const finishedStudentPieces: PieceState[] = [
  ...Array.from({ length: 4 }, (_, index) => ({ id: `s${index + 1}`, player: "STUDENT" as const, position: { kind: "TRACK" as const, progress: 57 } })),
  ...Array.from({ length: 4 }, (_, index) => ({ id: `m${index + 1}`, player: "MACHINE" as const, position: { kind: "BASE" as const } })),
];

describe.sequential("FM-017 persistent game sessions and turns", () => {
  beforeAll(async () => {
    await assertDatabaseMarker(prisma, readDatabaseEnvironment().appEnvId);
    const passwordHash = await hashPassword("FM017-Teste-2026");
    const teacherRow = await prisma.user.create({ data: { name: "FM017 Professor", email: `teacher-${suffix}@example.invalid`, normalizedEmail: `teacher-${suffix}@example.invalid`, passwordHash } });
    teacher = { id: teacherRow.id, name: teacherRow.name, globalRole: null, studentCode: null };
    userIds.push(teacherRow.id);
    const studentRows = await Promise.all(Array.from({ length: 3 }, (_, index) => prisma.user.create({
      data: { name: `FM017 Aluno ${index + 1}`, studentCode: `FM017-${index + 1}-${suffix}`, passwordHash },
    })));
    students = studentRows.map((row) => ({ id: row.id, name: row.name, globalRole: null, studentCode: row.studentCode }));
    userIds.push(...studentRows.map(({ id }) => id));

    const school = await prisma.school.create({ data: { name: "FM017 Escola", externalCode: `FM017-${suffix}` } });
    schoolId = school.id;
    const year = await prisma.academicYear.create({ data: { schoolId, year: 2093 } });
    yearId = year.id;
    const group = await prisma.classGroup.create({ data: { schoolId, academicYearId: year.id, grade: 4, name: "FM017 4A", normalizedName: `fm017-${suffix}` } });
    classId = group.id;
    const membership = await prisma.schoolMembership.create({ data: { userId: teacher.id, schoolId, role: "TEACHER" } });
    membershipId = membership.id;
    assignmentId = (await prisma.teacherClassAssignment.create({ data: { membershipId, teacherId: teacher.id, schoolId, classId } })).id;
    for (const student of students) {
      const enrollment = await prisma.enrollment.create({ data: { studentId: student.id, schoolId, classId } });
      enrollmentIds.push(enrollment.id);
    }

    const theme = await prisma.theme.create({ data: { name: `FM017 Tema ${suffix}`, normalizedName: `fm017-tema-${suffix}` } });
    themeId = theme.id;
    for (let difficulty = 1; difficulty <= 6; difficulty += 1) {
      const question = await prisma.question.create({ data: { origin: "PRIVATE", ownerId: teacher.id, createdById: teacher.id } });
      questionIds.push(question.id);
      if (difficulty === 2) difficultyTwoQuestionId = question.id;
      const version = await prisma.questionVersion.create({
        data: {
          questionId: question.id,
          versionNumber: 1,
          grade: 4,
          difficulty,
          themeId,
          statement: `Quanto vale ${difficulty} mais zero?`,
          answerType: "NUMERIC",
          numericExpected: String(difficulty),
          explanation: `O resultado correto é ${difficulty}.`,
          contentHash: String(difficulty).padEnd(64, "0"),
          createdById: teacher.id,
        },
      });
      versionIds.push(version.id);
      if (difficulty === 3) {
        mediaId = (await prisma.questionMedia.create({ data: { versionId: version.id, mimeType: "image/png", byteSize: 4, altText: "Imagem do desafio FM017", contentHash: "a".repeat(64), bytes: new Uint8Array([1, 2, 3, 4]) } })).id;
      }
    }
    const activity = await prisma.activity.create({
      data: { schoolId, classId, teacherId: teacher.id, title: "FM017 Partida", targetCount: 6, status: "OPEN", openedAt: new Date() },
    });
    activityId = activity.id;
    await prisma.activityQuestionVersion.createMany({ data: versionIds.map((questionVersionId) => ({ activityId, questionVersionId })) });
    await prisma.activityParticipation.createMany({
      data: students.map((student, index) => ({ activityId, enrollmentId: enrollmentIds[index]!, studentId: student.id })),
    });
  });

  afterAll(async () => {
    if (activityId) {
      const games = await prisma.gameSession.findMany({ where: { participation: { activityId } }, select: { id: true } });
      const gameIds = games.map(({ id }) => id);
      await prisma.gameAction.deleteMany({ where: { gameId: { in: gameIds } } });
      await prisma.gameChallenge.deleteMany({ where: { gameId: { in: gameIds } } });
      await prisma.gameSession.deleteMany({ where: { id: { in: gameIds } } });
      await prisma.activityParticipation.deleteMany({ where: { activityId } });
      await prisma.activityQuestionVersion.deleteMany({ where: { activityId } });
      await prisma.activity.deleteMany({ where: { id: activityId } });
    }
    await prisma.auditEvent.deleteMany({ where: { actorId: { in: userIds } } });
    if (mediaId) await prisma.questionMedia.deleteMany({ where: { id: mediaId } });
    await prisma.questionVersion.deleteMany({ where: { id: { in: versionIds } } });
    await prisma.question.deleteMany({ where: { id: { in: questionIds } } });
    if (themeId) await prisma.theme.deleteMany({ where: { id: themeId } });
    await prisma.enrollment.deleteMany({ where: { id: { in: enrollmentIds } } });
    if (assignmentId) await prisma.teacherClassAssignment.deleteMany({ where: { id: assignmentId } });
    if (membershipId) await prisma.schoolMembership.deleteMany({ where: { id: membershipId } });
    if (classId) await prisma.classGroup.deleteMany({ where: { id: classId } });
    if (yearId) await prisma.academicYear.deleteMany({ where: { id: yearId } });
    if (schoolId) await prisma.school.deleteMany({ where: { id: schoolId } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  });

  it("starts once, persists the first release, retries idempotently, and returns no answer key", async () => {
    const first = await startOrResumeGame({ actor: students[0]!, activityId });
    const resumed = await startOrResumeGame({ actor: students[0]!, activityId });
    expect(resumed.id).toBe(first.id);
    expect(await prisma.gameSession.count({ where: { participation: { activityId, studentId: students[0]!.id }, status: "ACTIVE" } })).toBe(1);

    const releaseAction = randomUUID();
    const release = await rollGame({ actor: students[0]!, gameId: first.id, clientActionId: releaseAction, expectedRevision: 1, randomInt: sequence(5) });
    expect(release).toMatchObject({ retried: false, game: { revision: 2, phase: "STUDENT_ROLL" }, roll: { studentDice: 6 } });
    expect(release.game.pieces.find(({ id }) => id === "s1")?.position).toEqual({ kind: "TRACK", progress: 0 });
    const retry = await rollGame({ actor: students[0]!, gameId: first.id, clientActionId: releaseAction, expectedRevision: 1, randomInt: () => { throw new Error("RNG não deve ser chamada no retry."); } });
    expect(retry).toMatchObject({ retried: true, roll: { studentDice: 6 }, game: { revision: 2 } });

    const challenge = await rollGame({ actor: students[0]!, gameId: first.id, clientActionId: randomUUID(), expectedRevision: 2, randomInt: sequence(2, 0) });
    expect(challenge.game.challenge).toMatchObject({ difficulty: 3, dice: 3, isRepeated: false });
    const serialized = JSON.stringify(challenge);
    expect(serialized).not.toContain("numericExpected");
    expect(serialized).not.toContain("explanation");
    expect(serialized).not.toContain("isCorrect");
    expect(await getAuthorizedMedia({ actor: students[0]!, mediaId })).toMatchObject({ mimeType: "image/png", contentHash: "a".repeat(64) });
    await expect(getAuthorizedMedia({ actor: students[1]!, mediaId })).rejects.toMatchObject({ code: "NOT_FOUND" });

    await prisma.gameChallenge.update({ where: { id: challenge.game.challenge!.id }, data: { status: "ANSWERED", answeredAt: new Date() } });
    await prisma.gameSession.update({ where: { id: first.id }, data: { phase: "STUDENT_ROLL", revision: 4 } });
    const repeated = await rollGame({ actor: students[0]!, gameId: first.id, clientActionId: randomUUID(), expectedRevision: 4, randomInt: sequence(2, 0) });
    expect(repeated.game.challenge).toMatchObject({ difficulty: 3, isRepeated: true });
  });

  it("serializes two tabs and rejects a hostile student's direct call", async () => {
    const game = await startOrResumeGame({ actor: students[1]!, activityId });
    const attempts = await Promise.allSettled([
      rollGame({ actor: students[1]!, gameId: game.id, clientActionId: randomUUID(), expectedRevision: 1, randomInt: sequence(5) }),
      rollGame({ actor: students[1]!, gameId: game.id, clientActionId: randomUUID(), expectedRevision: 1, randomInt: sequence(5) }),
    ]);
    expect(attempts.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
    expect(attempts.filter(({ status }) => status === "rejected")).toHaveLength(1);
    expect(await prisma.gameAction.count({ where: { gameId: game.id } })).toBe(1);
    await expect(getGameSession({ actor: students[0]!, gameId: game.id })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("records no-move and missing-content turns without fabricating a challenge", async () => {
    const game = await startOrResumeGame({ actor: students[2]!, activityId });
    await prisma.gameSession.update({ where: { id: game.id }, data: { phase: "STUDENT_ROLL", pieces: finishedStudentPieces as unknown as Prisma.InputJsonValue } });
    const blocked = await rollGame({ actor: students[2]!, gameId: game.id, clientActionId: randomUUID(), expectedRevision: 1, randomInt: sequence(1, 0) });
    expect(blocked).toMatchObject({ game: { revision: 2, challenge: null }, roll: { studentDice: 2, noChallengeReason: "NO_LEGAL_MOVE" } });

    const movable = finishedStudentPieces.map((piece) => piece.id === "s1" ? { ...piece, position: { kind: "TRACK" as const, progress: 0 } } : piece);
    await prisma.gameSession.update({ where: { id: game.id }, data: { pieces: movable as unknown as Prisma.InputJsonValue } });
    await prisma.question.update({ where: { id: difficultyTwoQuestionId }, data: { status: "ARCHIVED" } });
    const unavailable = await rollGame({ actor: students[2]!, gameId: game.id, clientActionId: randomUUID(), expectedRevision: 2, randomInt: sequence(1, 0) });
    expect(unavailable).toMatchObject({ game: { challenge: null }, roll: { studentDice: 2, noChallengeReason: "CONTENT_UNAVAILABLE" } });
    await prisma.question.update({ where: { id: difficultyTwoQuestionId }, data: { status: "ACTIVE" } });
  });

  it("suspends revoked and closed sessions and cancels pending challenges", async () => {
    const revoked = await startOrResumeGame({ actor: students[1]!, activityId });
    await prisma.enrollment.update({ where: { id: enrollmentIds[1]! }, data: { status: "ENDED", endsAt: new Date() } });
    await expect(rollGame({ actor: students[1]!, gameId: revoked.id, clientActionId: randomUUID(), expectedRevision: revoked.revision, randomInt: sequence(0) })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await prisma.gameSession.findUniqueOrThrow({ where: { id: revoked.id }, select: { status: true } })).toEqual({ status: "SUSPENDED" });

    const activity = await prisma.activity.findUniqueOrThrow({ where: { id: activityId }, select: { revision: true } });
    await closeActivity({ actor: teacher, activityId, revision: activity.revision });
    expect(await prisma.gameSession.count({ where: { participation: { activityId }, status: "ACTIVE" } })).toBe(0);
    expect(await prisma.gameChallenge.count({ where: { game: { participation: { activityId } }, status: "PENDING" } })).toBe(0);
    await expect(getAuthorizedMedia({ actor: students[0]!, mediaId })).rejects.toMatchObject({ code: "NOT_FOUND" });
    const closedGame = await prisma.gameSession.findFirstOrThrow({ where: { participation: { studentId: students[2]!.id } }, select: { id: true, revision: true } });
    await expect(rollGame({ actor: students[2]!, gameId: closedGame.id, clientActionId: randomUUID(), expectedRevision: closedGame.revision, randomInt: sequence(0) })).rejects.toMatchObject({ code: "STATE_CONFLICT" });
  });
});
