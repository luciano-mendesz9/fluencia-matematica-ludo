import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { hashPassword } from "../../src/server/auth/password";
import type { AuthenticatedPrincipal } from "../../src/server/auth/policies";
import { createAcademicYear, createClassGroup, getClassGroup, updateClassGroup } from "../../src/server/academics/service";
import { readDatabaseEnvironment } from "../../src/server/database/environment";
import { assertDatabaseMarker } from "../../src/server/database/marker";
import {
  authorizeCoordinatorStudentReset,
  createStudent,
  endEnrollment,
  getStudent,
  listStudents,
  transferStudent,
} from "../../src/server/students/service";

const suffix = randomUUID();
const userIds: string[] = [];
const schoolIds: string[] = [];
let admin: AuthenticatedPrincipal;
let coordinator: AuthenticatedPrincipal;
let teacher: AuthenticatedPrincipal;
let schoolAId: string;
let schoolBId: string;
let classAId: string;
let classBId: string;
let foreignClassId: string;
let created: Awaited<ReturnType<typeof createStudent>>;

describe.sequential("students and enrollments against PostgreSQL", () => {
  beforeAll(async () => {
    await assertDatabaseMarker(prisma, readDatabaseEnvironment().appEnvId);
    const passwordHash = await hashPassword("FM008-Teste-2026");
    const users = await Promise.all([
      prisma.user.create({ data: { name: "FM008 Admin", email: `fm008-admin-${suffix}@example.invalid`, normalizedEmail: `fm008-admin-${suffix}@example.invalid`, passwordHash, globalRole: "SEMED_ADMIN" } }),
      prisma.user.create({ data: { name: "FM008 Coordinator", email: `fm008-coordinator-${suffix}@example.invalid`, normalizedEmail: `fm008-coordinator-${suffix}@example.invalid`, passwordHash } }),
      prisma.user.create({ data: { name: "FM008 Teacher", email: `fm008-teacher-${suffix}@example.invalid`, normalizedEmail: `fm008-teacher-${suffix}@example.invalid`, passwordHash } }),
    ]);
    userIds.push(...users.map((user) => user.id));
    admin = { id: users[0]!.id, name: users[0]!.name, globalRole: "SEMED_ADMIN", studentCode: null };
    coordinator = { id: users[1]!.id, name: users[1]!.name, globalRole: null, studentCode: null };
    teacher = { id: users[2]!.id, name: users[2]!.name, globalRole: null, studentCode: null };
    const [schoolA, schoolB] = await Promise.all([
      prisma.school.create({ data: { name: "FM008 Escola A", externalCode: `FM008-A-${suffix}` } }),
      prisma.school.create({ data: { name: "FM008 Escola B", externalCode: `FM008-B-${suffix}` } }),
    ]);
    schoolAId = schoolA.id;
    schoolBId = schoolB.id;
    schoolIds.push(schoolAId, schoolBId);
    await prisma.schoolMembership.createMany({ data: [
      { userId: coordinator.id, schoolId: schoolAId, role: "COORDINATOR" },
      { userId: teacher.id, schoolId: schoolAId, role: "TEACHER" },
    ] });
    const yearA = await createAcademicYear({ actor: admin, schoolId: schoolAId, year: 2028 });
    const yearB = await createAcademicYear({ actor: admin, schoolId: schoolBId, year: 2028 });
    const classA = await createClassGroup({ actor: admin, schoolId: schoolAId, academicYearId: yearA.id, grade: 3, name: "FM008 Turma A" });
    const classB = await createClassGroup({ actor: admin, schoolId: schoolAId, academicYearId: yearA.id, grade: 3, name: "FM008 Turma B" });
    const foreignClass = await createClassGroup({ actor: admin, schoolId: schoolBId, academicYearId: yearB.id, grade: 3, name: "FM008 Turma Estrangeira" });
    classAId = classA.id;
    classBId = classB.id;
    foreignClassId = foreignClass.id;
  });

  afterAll(async () => {
    const studentIds = await prisma.user.findMany({ where: { name: { startsWith: "FM008 Aluno" } }, select: { id: true } });
    const allUserIds = [...userIds, ...studentIds.map(({ id }) => id)];
    await prisma.session.deleteMany({ where: { userId: { in: allUserIds } } });
    await prisma.passwordReset.deleteMany({ where: { userId: { in: allUserIds } } });
    await prisma.auditEvent.deleteMany({ where: { OR: [{ actorId: { in: allUserIds } }, { schoolId: { in: schoolIds } }, { targetId: { in: allUserIds } }] } });
    await prisma.enrollment.deleteMany({ where: { schoolId: { in: schoolIds } } });
    await prisma.classGroup.deleteMany({ where: { schoolId: { in: schoolIds } } });
    await prisma.academicYear.deleteMany({ where: { schoolId: { in: schoolIds } } });
    await prisma.schoolMembership.deleteMany({ where: { schoolId: { in: schoolIds } } });
    await prisma.school.deleteMany({ where: { id: { in: schoolIds } } });
    await prisma.user.deleteMany({ where: { id: { in: allUserIds } } });
    await prisma.$disconnect();
  });

  it("creates an individual student and discloses the unpredictable code only in the creation result", async () => {
    created = await createStudent({ actor: coordinator, schoolId: schoolAId, classId: classAId, name: "  FM008 Aluno Principal  ", temporaryPassword: "Senha-Temporaria-2026" });
    userIds.push(created.student.id);
    expect(created.studentCode).toMatch(/^AL-[0-9A-F]{16}$/);
    const stored = await prisma.user.findUniqueOrThrow({ where: { id: created.student.id } });
    expect(stored.studentCode).toBe(created.studentCode);
    expect(stored.passwordHash).not.toBe("Senha-Temporaria-2026");
    const listed = await listStudents({ actor: coordinator, schoolId: schoolAId });
    const detailed = await getStudent({ actor: coordinator, schoolId: schoolAId, studentId: created.student.id });
    expect(listed).toMatchObject([{ id: created.student.id, activeEnrollment: { classId: classAId } }]);
    expect(listed[0]).not.toHaveProperty("studentCode");
    expect(listed[0]).not.toHaveProperty("passwordHash");
    expect(detailed).not.toHaveProperty("studentCode");
  });

  it("denies teachers, foreign coordinators and a class from another school", async () => {
    await expect(listStudents({ actor: teacher, schoolId: schoolAId })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(listStudents({ actor: coordinator, schoolId: schoolBId })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(createStudent({ actor: coordinator, schoolId: schoolAId, classId: foreignClassId, name: "FM008 Aluno Inválido", temporaryPassword: "Senha-Temporaria-2026" }))
      .rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("enforces one active principal enrollment at the database boundary", async () => {
    await expect(prisma.enrollment.create({ data: { studentId: created.student.id, schoolId: schoolAId, classId: classBId } }))
      .rejects.toMatchObject({ code: "P2002" });
  });

  it("rejects an invalid enrollment period at the database boundary", async () => {
    const startsAt = new Date("2028-02-02T12:00:00.000Z");
    await expect(prisma.enrollment.create({
      data: {
        studentId: created.student.id,
        schoolId: schoolAId,
        classId: classAId,
        status: "ENDED",
        startsAt,
        endsAt: new Date(startsAt.getTime() - 1),
      },
    })).rejects.toMatchObject({ code: "P2039" });
  });

  it("blocks class inactivation while an active enrollment exists", async () => {
    const classA = await getClassGroup({ actor: admin, schoolId: schoolAId, classGroupId: classAId });
    await expect(updateClassGroup({ actor: admin, schoolId: schoolAId, classGroupId: classA.id, academicYearId: classA.academicYearId, grade: classA.grade, name: classA.name, status: "INACTIVE", revision: classA.revision }))
      .rejects.toMatchObject({ code: "STATE_CONFLICT" });
  });

  it("serializes concurrent transfers, preserves history and keeps the access code stable", async () => {
    const revision = created.enrollment.revision;
    const attempts = await Promise.allSettled([
      transferStudent({ actor: coordinator, schoolId: schoolAId, studentId: created.student.id, targetClassId: classBId, enrollmentRevision: revision }),
      transferStudent({ actor: coordinator, schoolId: schoolAId, studentId: created.student.id, targetClassId: classBId, enrollmentRevision: revision }),
    ]);
    expect(attempts.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
    expect(attempts.filter(({ status }) => status === "rejected")).toHaveLength(1);
    const student = await getStudent({ actor: coordinator, schoolId: schoolAId, studentId: created.student.id });
    expect(student.activeEnrollment?.classId).toBe(classBId);
    expect(student.enrollments).toHaveLength(2);
    expect(student.enrollments.filter(({ status }) => status === "ACTIVE")).toHaveLength(1);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: created.student.id }, select: { studentCode: true } })).studentCode).toBe(created.studentCode);
  });

  it("authorizes coordinator reset only for the current school and ends logically without deleting history", async () => {
    await expect(authorizeCoordinatorStudentReset({ actorId: coordinator.id, studentId: created.student.id, schoolId: schoolAId })).resolves.toMatchObject({ schoolId: schoolAId });
    await expect(authorizeCoordinatorStudentReset({ actorId: coordinator.id, studentId: created.student.id, schoolId: schoolBId })).resolves.toBeNull();
    const current = await getStudent({ actor: coordinator, schoolId: schoolAId, studentId: created.student.id });
    const ended = await endEnrollment({ actor: coordinator, schoolId: schoolAId, studentId: created.student.id, enrollmentRevision: current.activeEnrollment!.revision });
    expect(ended).toMatchObject({ status: "ENDED", classId: classBId });
    const after = await getStudent({ actor: coordinator, schoolId: schoolAId, studentId: created.student.id });
    expect(after.activeEnrollment).toBeNull();
    expect(after.enrollments).toHaveLength(2);
    await expect(authorizeCoordinatorStudentReset({ actorId: coordinator.id, studentId: created.student.id, schoolId: schoolAId })).resolves.toBeNull();
  });
});
