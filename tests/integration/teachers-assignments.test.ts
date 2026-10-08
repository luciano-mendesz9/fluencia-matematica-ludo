import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { hashPassword } from "../../src/server/auth/password";
import type { AuthenticatedPrincipal } from "../../src/server/auth/policies";
import { createAcademicYear, createClassGroup, getClassGroup, updateClassGroup } from "../../src/server/academics/service";
import { readDatabaseEnvironment } from "../../src/server/database/environment";
import { assertDatabaseMarker } from "../../src/server/database/marker";
import {
  createGlobalAdult,
  createLocalAdult,
  createTeacherAssignment,
  endTeacherAssignment,
  linkExistingAdult,
  listAssignedClasses,
  listSchoolAdults,
  resolveActiveClassAssignment,
  suspendLocalMembership,
  updateGlobalAdultStatus,
} from "../../src/server/people/service";

const suffix = randomUUID();
const userIds: string[] = [];
const schoolIds: string[] = [];
let admin: AuthenticatedPrincipal;
let coordinator: AuthenticatedPrincipal;
let schoolAId: string;
let schoolBId: string;
let classAId: string;
let classBId: string;
let teacherId: string;
let membershipA: Awaited<ReturnType<typeof createLocalAdult>>["membership"];
let membershipB: Awaited<ReturnType<typeof linkExistingAdult>>["membership"];
let assignmentA: Awaited<ReturnType<typeof createTeacherAssignment>>;
let assignmentB: Awaited<ReturnType<typeof createTeacherAssignment>>;

describe.sequential("adults, roles and teacher assignments against PostgreSQL", () => {
  beforeAll(async () => {
    await assertDatabaseMarker(prisma, readDatabaseEnvironment().appEnvId);
    const passwordHash = await hashPassword("FM009-Teste-2026");
    const users = await Promise.all([
      prisma.user.create({ data: { name: "FM009 Admin", email: `fm009-admin-${suffix}@example.invalid`, normalizedEmail: `fm009-admin-${suffix}@example.invalid`, passwordHash, globalRole: "SEMED_ADMIN" } }),
      prisma.user.create({ data: { name: "FM009 Coordinator", email: `fm009-coordinator-${suffix}@example.invalid`, normalizedEmail: `fm009-coordinator-${suffix}@example.invalid`, passwordHash } }),
    ]);
    userIds.push(...users.map(({ id }) => id));
    admin = { id: users[0]!.id, name: users[0]!.name, globalRole: "SEMED_ADMIN", studentCode: null };
    coordinator = { id: users[1]!.id, name: users[1]!.name, globalRole: null, studentCode: null };
    const [schoolA, schoolB] = await Promise.all([
      prisma.school.create({ data: { name: "FM009 Escola A", externalCode: `FM009-A-${suffix}` } }),
      prisma.school.create({ data: { name: "FM009 Escola B", externalCode: `FM009-B-${suffix}` } }),
    ]);
    schoolAId = schoolA.id;
    schoolBId = schoolB.id;
    schoolIds.push(schoolAId, schoolBId);
    await prisma.schoolMembership.create({ data: { userId: coordinator.id, schoolId: schoolAId, role: "COORDINATOR" } });
    const [yearA, yearB] = await Promise.all([
      createAcademicYear({ actor: admin, schoolId: schoolAId, year: 2029 }),
      createAcademicYear({ actor: admin, schoolId: schoolBId, year: 2029 }),
    ]);
    const [classA, classB] = await Promise.all([
      createClassGroup({ actor: admin, schoolId: schoolAId, academicYearId: yearA.id, grade: 4, name: "FM009 Turma A" }),
      createClassGroup({ actor: admin, schoolId: schoolBId, academicYearId: yearB.id, grade: 4, name: "FM009 Turma B" }),
    ]);
    classAId = classA.id;
    classBId = classB.id;
  });

  afterAll(async () => {
    const syntheticUsers = await prisma.user.findMany({ where: { OR: [{ id: { in: userIds } }, { normalizedEmail: { contains: suffix } }] }, select: { id: true } });
    const allUserIds = syntheticUsers.map(({ id }) => id);
    await prisma.session.deleteMany({ where: { userId: { in: allUserIds } } });
    await prisma.passwordReset.deleteMany({ where: { userId: { in: allUserIds } } });
    await prisma.auditEvent.deleteMany({ where: { OR: [{ actorId: { in: allUserIds } }, { schoolId: { in: schoolIds } }, { targetId: { in: allUserIds } }] } });
    await prisma.teacherClassAssignment.deleteMany({ where: { schoolId: { in: schoolIds } } });
    await prisma.classGroup.deleteMany({ where: { schoolId: { in: schoolIds } } });
    await prisma.academicYear.deleteMany({ where: { schoolId: { in: schoolIds } } });
    await prisma.schoolMembership.deleteMany({ where: { schoolId: { in: schoolIds } } });
    await prisma.school.deleteMany({ where: { id: { in: schoolIds } } });
    await prisma.user.deleteMany({ where: { id: { in: allUserIds } } });
    await prisma.$disconnect();
  });

  it("lets a coordinator create only a teacher in the current school", async () => {
    const created = await createLocalAdult({
      actor: coordinator,
      schoolId: schoolAId,
      name: "  FM009 Professor  ",
      email: `fm009-teacher-${suffix}@example.invalid`,
      temporaryPassword: "Senha-Temporaria-2026",
      role: "TEACHER",
    });
    teacherId = created.user.id;
    userIds.push(teacherId);
    membershipA = created.membership;
    expect(created).toMatchObject({ user: { name: "FM009 Professor", email: `fm009-teacher-${suffix}@example.invalid` }, membership: { role: "TEACHER", status: "ACTIVE" } });
    expect(created.user).not.toHaveProperty("passwordHash");
    await expect(createLocalAdult({ actor: coordinator, schoolId: schoolAId, name: "Autoelevação", email: `fm009-elevate-${suffix}@example.invalid`, temporaryPassword: "Senha-Temporaria-2026", role: "COORDINATOR" }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(createGlobalAdult({ actor: coordinator, name: "Admin forjado", email: `fm009-forged-${suffix}@example.invalid`, temporaryPassword: "Senha-Temporaria-2026", globalRole: "SEMED_ADMIN" }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("reuses the same adult identity in another school and rejects duplicate membership", async () => {
    membershipB = (await linkExistingAdult({ actor: admin, schoolId: schoolBId, email: `fm009-teacher-${suffix}@example.invalid`, role: "TEACHER" })).membership;
    await expect(linkExistingAdult({ actor: admin, schoolId: schoolBId, email: `fm009-teacher-${suffix}@example.invalid`, role: "TEACHER" }))
      .rejects.toMatchObject({ code: "STATE_CONFLICT" });
    const peopleA = await listSchoolAdults({ actor: coordinator, schoolId: schoolAId });
    expect(peopleA.find(({ user }) => user.id === teacherId)).toMatchObject({ role: "TEACHER" });
    await expect(listSchoolAdults({ actor: coordinator, schoolId: schoolBId })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("creates scoped assignments and rejects foreign class and invalid periods", async () => {
    const teacher: AuthenticatedPrincipal = { id: teacherId, name: "FM009 Professor", globalRole: null, studentCode: null };
    assignmentA = await createTeacherAssignment({ actor: coordinator, schoolId: schoolAId, membershipId: membershipA.id, classId: classAId, startsAt: new Date() });
    assignmentB = await createTeacherAssignment({ actor: admin, schoolId: schoolBId, membershipId: membershipB.id, classId: classBId, startsAt: new Date() });
    await expect(createTeacherAssignment({ actor: coordinator, schoolId: schoolAId, membershipId: membershipA.id, classId: classBId, startsAt: new Date() }))
      .rejects.toMatchObject({ code: "NOT_FOUND" });
    const startsAt = new Date(Date.now() + 86_400_000);
    await expect(createTeacherAssignment({ actor: coordinator, schoolId: schoolAId, membershipId: membershipA.id, classId: classAId, startsAt, endsAt: new Date(startsAt.getTime() - 1) }))
      .rejects.toMatchObject({ code: "VALIDATION" });
    await expect(listAssignedClasses({ actor: teacher, schoolId: schoolAId })).resolves.toMatchObject([{ classId: classAId }]);
    await expect(listAssignedClasses({ actor: teacher, schoolId: schoolBId })).resolves.toMatchObject([{ classId: classBId }]);
    await expect(resolveActiveClassAssignment({ teacherId, classId: classAId })).resolves.toMatchObject({ schoolId: schoolAId });
  });

  it("enforces assignment uniqueness at the database boundary and blocks class inactivation", async () => {
    await expect(prisma.teacherClassAssignment.create({ data: { membershipId: membershipA.id, teacherId, schoolId: schoolAId, classId: classAId } }))
      .rejects.toMatchObject({ code: "P2002" });
    const foreignStartsAt = new Date("2029-01-01T12:00:00.000Z");
    await expect(prisma.teacherClassAssignment.create({
      data: {
        membershipId: membershipA.id,
        teacherId,
        schoolId: schoolAId,
        classId: classBId,
        status: "ENDED",
        startsAt: foreignStartsAt,
        endsAt: new Date(foreignStartsAt.getTime() + 1_000),
      },
    }))
      .rejects.toMatchObject({ code: "P2003" });
    const startsAt = new Date("2029-02-02T12:00:00.000Z");
    await expect(prisma.teacherClassAssignment.create({
      data: {
        membershipId: membershipA.id,
        teacherId,
        schoolId: schoolAId,
        classId: classAId,
        status: "ENDED",
        startsAt,
        endsAt: new Date(startsAt.getTime() - 1),
      },
    })).rejects.toMatchObject({ code: "P2039" });
    const classA = await getClassGroup({ actor: admin, schoolId: schoolAId, classGroupId: classAId });
    await expect(updateClassGroup({ actor: admin, schoolId: schoolAId, classGroupId: classA.id, academicYearId: classA.academicYearId, grade: classA.grade, name: classA.name, status: "INACTIVE", revision: classA.revision }))
      .rejects.toMatchObject({ code: "STATE_CONFLICT" });
  });

  it("allows one concurrent assignment ending and preserves history", async () => {
    const attempts = await Promise.allSettled([
      endTeacherAssignment({ actor: admin, schoolId: schoolBId, assignmentId: assignmentB.id, revision: assignmentB.revision }),
      endTeacherAssignment({ actor: admin, schoolId: schoolBId, assignmentId: assignmentB.id, revision: assignmentB.revision }),
    ]);
    expect(attempts.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
    expect(attempts.filter(({ status }) => status === "rejected")).toHaveLength(1);
    expect(await prisma.teacherClassAssignment.count({ where: { teacherId, classId: classBId } })).toBe(1);
  });

  it("revokes membership and class access atomically without affecting the other school", async () => {
    const teacher: AuthenticatedPrincipal = { id: teacherId, name: "FM009 Professor", globalRole: null, studentCode: null };
    await suspendLocalMembership({ actor: coordinator, schoolId: schoolAId, membershipId: membershipA.id, revision: membershipA.revision });
    await expect(resolveActiveClassAssignment({ teacherId, classId: classAId })).resolves.toBeNull();
    await expect(listAssignedClasses({ actor: teacher, schoolId: schoolAId })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(listAssignedClasses({ actor: teacher, schoolId: schoolBId })).resolves.toEqual([]);
    await expect(prisma.teacherClassAssignment.findUniqueOrThrow({ where: { id: assignmentA.id } })).resolves.toMatchObject({ status: "ENDED" });
  });

  it("creates and blocks a global technical account with optimistic revision", async () => {
    const developer = await createGlobalAdult({ actor: admin, name: "FM009 Developer", email: `fm009-developer-${suffix}@example.invalid`, temporaryPassword: "Senha-Temporaria-2026", globalRole: "DEVELOPER" });
    userIds.push(developer.id);
    const blocked = await updateGlobalAdultStatus({ actor: admin, userId: developer.id, status: "BLOCKED", revision: developer.revision });
    expect(blocked).toMatchObject({ status: "BLOCKED", revision: developer.revision + 1 });
    await expect(updateGlobalAdultStatus({ actor: admin, userId: developer.id, status: "ACTIVE", revision: developer.revision }))
      .rejects.toMatchObject({ code: "STATE_CONFLICT" });
  });
});
