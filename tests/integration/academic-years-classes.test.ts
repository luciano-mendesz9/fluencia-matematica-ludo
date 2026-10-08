import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { hashPassword } from "../../src/server/auth/password";
import type { AuthenticatedPrincipal } from "../../src/server/auth/policies";
import {
  createAcademicYear,
  createClassGroup,
  getClassGroup,
  listAcademicYears,
  listClassGroups,
  updateAcademicYear,
  updateClassGroup,
} from "../../src/server/academics/service";
import { readDatabaseEnvironment } from "../../src/server/database/environment";
import { assertDatabaseMarker } from "../../src/server/database/marker";

const suffix = randomUUID();
const userIds: string[] = [];
const schoolIds: string[] = [];
const academicYearIds: string[] = [];
const classGroupIds: string[] = [];
let admin: AuthenticatedPrincipal;
let coordinator: AuthenticatedPrincipal;
let teacher: AuthenticatedPrincipal;
let schoolAId: string;
let schoolBId: string;
let yearA: Awaited<ReturnType<typeof createAcademicYear>>;
let yearB: Awaited<ReturnType<typeof createAcademicYear>>;
let classA: Awaited<ReturnType<typeof createClassGroup>>;

describe.sequential("academic years and classes against PostgreSQL", () => {
  beforeAll(async () => {
    await assertDatabaseMarker(prisma, readDatabaseEnvironment().appEnvId);
    const passwordHash = await hashPassword("FM007-Teste-2026");
    const users = await Promise.all([
      prisma.user.create({ data: { name: "FM007 Admin", email: `fm007-admin-${suffix}@example.invalid`, normalizedEmail: `fm007-admin-${suffix}@example.invalid`, passwordHash, globalRole: "SEMED_ADMIN" } }),
      prisma.user.create({ data: { name: "FM007 Coordinator", email: `fm007-coordinator-${suffix}@example.invalid`, normalizedEmail: `fm007-coordinator-${suffix}@example.invalid`, passwordHash } }),
      prisma.user.create({ data: { name: "FM007 Teacher", email: `fm007-teacher-${suffix}@example.invalid`, normalizedEmail: `fm007-teacher-${suffix}@example.invalid`, passwordHash } }),
    ]);
    userIds.push(...users.map((user) => user.id));
    admin = { id: users[0]!.id, name: users[0]!.name, globalRole: users[0]!.globalRole, studentCode: null };
    coordinator = { id: users[1]!.id, name: users[1]!.name, globalRole: null, studentCode: null };
    teacher = { id: users[2]!.id, name: users[2]!.name, globalRole: null, studentCode: null };
    const [schoolA, schoolB] = await Promise.all([
      prisma.school.create({ data: { name: "FM007 Escola A", externalCode: `FM007-A-${suffix}` } }),
      prisma.school.create({ data: { name: "FM007 Escola B", externalCode: `FM007-B-${suffix}` } }),
    ]);
    schoolAId = schoolA.id;
    schoolBId = schoolB.id;
    schoolIds.push(schoolAId, schoolBId);
    await prisma.schoolMembership.createMany({ data: [
      { userId: coordinator.id, schoolId: schoolAId, role: "COORDINATOR" },
      { userId: teacher.id, schoolId: schoolAId, role: "TEACHER" },
    ] });
  });

  afterAll(async () => {
    await prisma.auditEvent.deleteMany({
      where: {
        OR: [
          { actorId: { in: userIds } },
          { schoolId: { in: schoolIds } },
          { targetId: { in: [...academicYearIds, ...classGroupIds] } },
        ],
      },
    });
    await prisma.classGroup.deleteMany({ where: { schoolId: { in: schoolIds } } });
    await prisma.academicYear.deleteMany({ where: { schoolId: { in: schoolIds } } });
    await prisma.schoolMembership.deleteMany({ where: { schoolId: { in: schoolIds } } });
    await prisma.school.deleteMany({ where: { id: { in: schoolIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  });

  it("allows SEMED and the current coordinator to create scoped academic years", async () => {
    yearA = await createAcademicYear({ actor: coordinator, schoolId: schoolAId, year: 2026 });
    yearB = await createAcademicYear({ actor: admin, schoolId: schoolBId, year: 2026 });
    academicYearIds.push(yearA.id, yearB.id);
    await expect(listAcademicYears({ actor: coordinator, schoolId: schoolAId })).resolves.toMatchObject([
      { id: yearA.id, year: 2026, status: "ACTIVE" },
    ]);
  });

  it("rejects duplicates, teachers and a coordinator outside their school", async () => {
    await expect(createAcademicYear({ actor: coordinator, schoolId: schoolAId, year: 2026 }))
      .rejects.toMatchObject({ code: "STATE_CONFLICT" });
    await expect(createAcademicYear({ actor: teacher, schoolId: schoolAId, year: 2027 }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(listAcademicYears({ actor: coordinator, schoolId: schoolBId }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("creates only grades 1 to 5 in an active year of the same school", async () => {
    classA = await createClassGroup({ actor: coordinator, schoolId: schoolAId, academicYearId: yearA.id, grade: 3, name: " Turma  A " });
    classGroupIds.push(classA.id);
    expect(classA).toMatchObject({ name: "Turma A", grade: 3, schoolId: schoolAId, academicYearId: yearA.id });
    await expect(createClassGroup({ actor: coordinator, schoolId: schoolAId, academicYearId: yearA.id, grade: 6, name: "Inválida" }))
      .rejects.toMatchObject({ code: "VALIDATION" });
    await expect(createClassGroup({ actor: coordinator, schoolId: schoolAId, academicYearId: yearB.id, grade: 2, name: "Cruzada" }))
      .rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(createClassGroup({ actor: coordinator, schoolId: schoolAId, academicYearId: yearA.id, grade: 3, name: "turma a" }))
      .rejects.toMatchObject({ code: "STATE_CONFLICT" });
  });

  it("enforces the school/year foreign key even on a direct database write", async () => {
    await expect(prisma.classGroup.create({
      data: {
        schoolId: schoolAId,
        academicYearId: yearB.id,
        grade: 2,
        name: "Turma por fora",
        normalizedName: "turma por fora",
      },
    })).rejects.toMatchObject({ code: "P2003" });
  });

  it("filters reads by school and rejects a stale concurrent revision", async () => {
    await expect(getClassGroup({ actor: coordinator, schoolId: schoolAId, classGroupId: classA.id }))
      .resolves.toMatchObject({ id: classA.id });
    await expect(listClassGroups({ actor: admin, schoolId: schoolBId })).resolves.toEqual([]);
    const attempts = await Promise.allSettled([
      updateClassGroup({ actor: coordinator, schoolId: schoolAId, classGroupId: classA.id, academicYearId: yearA.id, grade: 3, name: "Turma A Azul", status: "ACTIVE", revision: classA.revision }),
      updateClassGroup({ actor: coordinator, schoolId: schoolAId, classGroupId: classA.id, academicYearId: yearA.id, grade: 3, name: "Turma A Branca", status: "ACTIVE", revision: classA.revision }),
    ]);
    expect(attempts.filter((attempt) => attempt.status === "fulfilled")).toHaveLength(1);
    expect(attempts.filter((attempt) => attempt.status === "rejected")).toHaveLength(1);
    const rejected = attempts.find((attempt): attempt is PromiseRejectedResult => attempt.status === "rejected");
    expect(rejected?.reason).toMatchObject({ code: "STATE_CONFLICT" });
  });

  it("requires active classes to be inactivated before the academic year", async () => {
    const currentClass = await getClassGroup({ actor: coordinator, schoolId: schoolAId, classGroupId: classA.id });
    await expect(updateAcademicYear({ actor: coordinator, schoolId: schoolAId, academicYearId: yearA.id, year: 2026, status: "INACTIVE", revision: yearA.revision }))
      .rejects.toMatchObject({ code: "STATE_CONFLICT" });
    await updateClassGroup({
      actor: coordinator,
      schoolId: schoolAId,
      classGroupId: currentClass.id,
      academicYearId: currentClass.academicYearId,
      grade: currentClass.grade,
      name: currentClass.name,
      status: "INACTIVE",
      revision: currentClass.revision,
    });
    const inactivatedYear = await updateAcademicYear({
      actor: coordinator,
      schoolId: schoolAId,
      academicYearId: yearA.id,
      year: 2026,
      status: "INACTIVE",
      revision: yearA.revision,
    });
    expect(inactivatedYear.status).toBe("INACTIVE");
    const auditCount = await prisma.auditEvent.count({
      where: { schoolId: schoolAId, action: { in: ["ACADEMIC_YEAR_CREATED", "ACADEMIC_YEAR_UPDATED", "CLASS_GROUP_CREATED", "CLASS_GROUP_UPDATED"] } },
    });
    expect(auditCount).toBeGreaterThanOrEqual(4);
  });
});
