import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { hashPassword } from "../../src/server/auth/password";
import type { AuthenticatedPrincipal } from "../../src/server/auth/policies";
import { assertDatabaseMarker } from "../../src/server/database/marker";
import { readDatabaseEnvironment } from "../../src/server/database/environment";
import { createQuestion, createSkill, createTheme, createVersion, getEligibleQuestion, listEligibleQuestions, updateQuestionStatus } from "../../src/server/questions/service";

const suffix = randomUUID();
let admin: AuthenticatedPrincipal;
let teacherA: AuthenticatedPrincipal;
let teacherB: AuthenticatedPrincipal;
let themeId: string;
let skillId: string;
const userIds: string[] = [];
const schoolIds: string[] = [];

describe.sequential("versioned question bank against PostgreSQL", () => {
  beforeAll(async () => {
    await assertDatabaseMarker(prisma, readDatabaseEnvironment().appEnvId);
    const passwordHash = await hashPassword("FM010-Teste-2026");
    const users = await Promise.all([
      prisma.user.create({ data: { name: "FM010 Admin", email: `fm010-admin-${suffix}@example.invalid`, normalizedEmail: `fm010-admin-${suffix}@example.invalid`, passwordHash, globalRole: "SEMED_ADMIN" } }),
      prisma.user.create({ data: { name: "FM010 Teacher A", email: `fm010-a-${suffix}@example.invalid`, normalizedEmail: `fm010-a-${suffix}@example.invalid`, passwordHash } }),
      prisma.user.create({ data: { name: "FM010 Teacher B", email: `fm010-b-${suffix}@example.invalid`, normalizedEmail: `fm010-b-${suffix}@example.invalid`, passwordHash } }),
    ]);
    userIds.push(...users.map((user) => user.id));
    admin = { id: users[0]!.id, name: users[0]!.name, globalRole: "SEMED_ADMIN", studentCode: null };
    teacherA = { id: users[1]!.id, name: users[1]!.name, globalRole: null, studentCode: null };
    teacherB = { id: users[2]!.id, name: users[2]!.name, globalRole: null, studentCode: null };
    const school = await prisma.school.create({ data: { name: "FM010 Escola", externalCode: `FM010-${suffix}` } }); schoolIds.push(school.id);
    const year = await prisma.academicYear.create({ data: { schoolId: school.id, year: 2094 } });
    const group = await prisma.classGroup.create({ data: { schoolId: school.id, academicYearId: year.id, grade: 1, name: "FM010 A", normalizedName: `fm010-a-${suffix}` } });
    for (const teacher of [teacherA, teacherB]) {
      const membership = await prisma.schoolMembership.create({ data: { userId: teacher.id, schoolId: school.id, role: "TEACHER" } });
      await prisma.teacherClassAssignment.create({ data: { membershipId: membership.id, teacherId: teacher.id, schoolId: school.id, classId: group.id } });
    }
    const theme = await createTheme({ actor: admin, name: `Álgebra ${suffix}` }); themeId = theme.id;
    const skill = await createSkill({ actor: admin, themeId, name: "Reconhecer padrões" }); skillId = skill.id;
  });

  afterAll(async () => {
    await prisma.auditEvent.deleteMany({ where: { actorId: { in: userIds } } });
    await prisma.questionVersion.deleteMany({ where: { createdById: { in: userIds } } });
    await prisma.question.deleteMany({ where: { createdById: { in: userIds } } });
    if (themeId) { await prisma.skill.deleteMany({ where: { themeId } }); await prisma.theme.deleteMany({ where: { id: themeId } }); }
    await prisma.teacherClassAssignment.deleteMany({ where: { teacherId: { in: userIds } } });
    await prisma.schoolMembership.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.classGroup.deleteMany({ where: { schoolId: { in: schoolIds } } });
    await prisma.academicYear.deleteMany({ where: { schoolId: { in: schoolIds } } });
    await prisma.school.deleteMany({ where: { id: { in: schoolIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } }); await prisma.$disconnect();
  });

  it("combines SEMED questions with only the current teacher private questions", async () => {
    const network = await createQuestion({ actor: admin, grade: 1, difficulty: 2, themeId, skillId, statement: "Complete a sequência 2, 4, 6, __." });
    const privateA = await createQuestion({ actor: teacherA, grade: 1, difficulty: 4, themeId, statement: "Descubra o número desconhecido em x + 3 = 8." });
    const privateB = await createQuestion({ actor: teacherB, grade: 1, difficulty: 5, themeId, statement: "Resolva uma questão privada do outro professor." });
    const visible = await listEligibleQuestions({ actor: teacherA });
    const visibleIds = visible.map(({ id }) => id);
    expect(visibleIds).toEqual(expect.arrayContaining([network.id, privateA.id]));
    expect(visibleIds).not.toContain(privateB.id);
    expect(visible[0]).not.toHaveProperty("answerKey");
  });

  it("rejects an incompatible skill and private IDOR", async () => {
    const otherTheme = await createTheme({ actor: admin, name: `Geometria ${suffix}` });
    await expect(createQuestion({ actor: teacherA, grade: 1, difficulty: 1, themeId: otherTheme.id, skillId, statement: "Uma questão incompatível." })).rejects.toMatchObject({ code: "VALIDATION" });
    const foreign = await createQuestion({ actor: teacherB, grade: 2, difficulty: 3, themeId, statement: "Conteúdo privado estrangeiro." });
    await expect(getEligibleQuestion({ actor: teacherA, questionId: foreign.id })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await prisma.theme.delete({ where: { id: otherTheme.id } });
  });

  it("creates exactly one next version under concurrent revision attempts", async () => {
    const question = await createQuestion({ actor: teacherA, grade: 1, difficulty: 1, themeId, statement: "Versão inicial para concorrência." });
    const attempts = await Promise.allSettled([1, 2].map((difficulty) => createVersion({ actor: teacherA, questionId: question.id, revision: question.revision, grade: 1, difficulty, themeId, statement: `Nova versão concorrente ${difficulty}.` })));
    expect(attempts.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
    expect(await prisma.questionVersion.count({ where: { questionId: question.id } })).toBe(2);
  });

  it("archives without deleting history and rejects status IDOR", async () => {
    const question = await createQuestion({ actor: teacherA, grade: 2, difficulty: 2, themeId, statement: "Questão preservada após arquivamento." });
    const archived = await updateQuestionStatus({ actor: teacherA, questionId: question.id, revision: question.revision, status: "ARCHIVED" });
    expect(archived).toMatchObject({ status: "ARCHIVED", revision: question.revision + 1 });
    await expect(listEligibleQuestions({ actor: teacherA, status: "ARCHIVED" })).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ id: question.id, status: "ARCHIVED" })]));
    await expect(updateQuestionStatus({ actor: teacherB, questionId: question.id, revision: archived.revision, status: "ACTIVE" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await prisma.questionVersion.count({ where: { questionId: question.id } })).toBe(1);
  });
});
