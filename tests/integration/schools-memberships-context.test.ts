import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma";
import { hashPassword } from "../../src/server/auth/password";
import type { AuthenticatedPrincipal } from "../../src/server/auth/policies";
import {
  addSchoolMembership,
  createSchool,
  listAvailableSchools,
  resolveActiveSchoolMembership,
  suspendSchoolMembership,
  updateSchool,
} from "../../src/server/schools/service";
import { readDatabaseEnvironment } from "../../src/server/database/environment";
import { assertDatabaseMarker } from "../../src/server/database/marker";

const suffix = randomUUID();
const userIds: string[] = [];
const schoolIds: string[] = [];
const membershipIds: string[] = [];
let admin: AuthenticatedPrincipal;
let teacher: AuthenticatedPrincipal;
let coordinator: AuthenticatedPrincipal;
let schoolA: Awaited<ReturnType<typeof createSchool>>;
let schoolB: Awaited<ReturnType<typeof createSchool>>;
let teacherA: Awaited<ReturnType<typeof addSchoolMembership>>;
let teacherB: Awaited<ReturnType<typeof addSchoolMembership>>;
let coordinatorA: Awaited<ReturnType<typeof addSchoolMembership>>;

describe.sequential("schools, memberships and context against PostgreSQL", () => {
  beforeAll(async () => {
    await assertDatabaseMarker(prisma, readDatabaseEnvironment().appEnvId);
    const passwordHash = await hashPassword("FM006-Teste-2026");
    const users = await Promise.all([
      prisma.user.create({ data: { name: "FM006 Admin", email: `fm006-admin-${suffix}@example.invalid`, normalizedEmail: `fm006-admin-${suffix}@example.invalid`, passwordHash, globalRole: "SEMED_ADMIN" } }),
      prisma.user.create({ data: { name: "FM006 Teacher", email: `fm006-teacher-${suffix}@example.invalid`, normalizedEmail: `fm006-teacher-${suffix}@example.invalid`, passwordHash } }),
      prisma.user.create({ data: { name: "FM006 Coordinator", email: `fm006-coordinator-${suffix}@example.invalid`, normalizedEmail: `fm006-coordinator-${suffix}@example.invalid`, passwordHash } }),
    ]);
    userIds.push(...users.map((user) => user.id));
    admin = { id: users[0]!.id, name: users[0]!.name, globalRole: users[0]!.globalRole, studentCode: null };
    teacher = { id: users[1]!.id, name: users[1]!.name, globalRole: null, studentCode: null };
    coordinator = { id: users[2]!.id, name: users[2]!.name, globalRole: null, studentCode: null };
  });

  afterAll(async () => {
    await prisma.auditEvent.deleteMany({
      where: {
        OR: [
          { actorId: { in: userIds } },
          { targetId: { in: [...userIds, ...schoolIds, ...membershipIds] } },
          { schoolId: { in: schoolIds } },
        ],
      },
    });
    await prisma.schoolMembership.deleteMany({ where: { schoolId: { in: schoolIds } } });
    await prisma.school.deleteMany({ where: { id: { in: schoolIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  });

  it("creates schools and server-authorized memberships for one adult in multiple schools", async () => {
    schoolA = await createSchool({ actor: admin, name: " Escola Azul ", externalCode: `az-${suffix}` });
    schoolB = await createSchool({ actor: admin, name: "Escola Branca", externalCode: `br-${suffix}` });
    schoolIds.push(schoolA.id, schoolB.id);

    teacherA = await addSchoolMembership({ actor: admin, schoolId: schoolA.id, adultEmail: `fm006-teacher-${suffix}@example.invalid`, role: "TEACHER" });
    teacherB = await addSchoolMembership({ actor: admin, schoolId: schoolB.id, adultEmail: `fm006-teacher-${suffix}@example.invalid`, role: "TEACHER" });
    coordinatorA = await addSchoolMembership({ actor: admin, schoolId: schoolA.id, adultEmail: `fm006-coordinator-${suffix}@example.invalid`, role: "COORDINATOR" });
    membershipIds.push(teacherA.id, teacherB.id, coordinatorA.id);

    await expect(listAvailableSchools(teacher.id)).resolves.toEqual([
      { id: schoolA.id, name: "Escola Azul", role: "TEACHER" },
      { id: schoolB.id, name: "Escola Branca", role: "TEACHER" },
    ]);
    await expect(listAvailableSchools(coordinator.id)).resolves.toEqual([
      { id: schoolA.id, name: "Escola Azul", role: "COORDINATOR" },
    ]);
  });

  it("rejects duplicate active membership and a non-SEMED actor", async () => {
    await expect(addSchoolMembership({ actor: admin, schoolId: schoolA.id, adultEmail: `fm006-teacher-${suffix}@example.invalid`, role: "TEACHER" }))
      .rejects.toMatchObject({ code: "STATE_CONFLICT" });

    const scheduledSchool = await createSchool({ actor: admin, name: "Escola com período", externalCode: `pe-${suffix}` });
    schoolIds.push(scheduledSchool.id);
    const scheduledMembership = await prisma.schoolMembership.create({
      data: {
        userId: teacher.id,
        schoolId: scheduledSchool.id,
        role: "TEACHER",
        endsAt: new Date(Date.now() + 86_400_000),
      },
    });
    membershipIds.push(scheduledMembership.id);
    await expect(addSchoolMembership({ actor: admin, schoolId: scheduledSchool.id, adultEmail: `fm006-teacher-${suffix}@example.invalid`, role: "TEACHER" }))
      .rejects.toMatchObject({ code: "STATE_CONFLICT" });

    await expect(createSchool({ actor: teacher, name: "Escola forjada" }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("excludes future, revoked and foreign memberships from the context", async () => {
    const futureSchool = await createSchool({ actor: admin, name: "Escola Futura", externalCode: `fu-${suffix}` });
    schoolIds.push(futureSchool.id);
    const futureMembership = await prisma.schoolMembership.create({
      data: {
        userId: teacher.id,
        schoolId: futureSchool.id,
        role: "TEACHER",
        startsAt: new Date(Date.now() + 86_400_000),
      },
    });
    membershipIds.push(futureMembership.id);
    expect((await listAvailableSchools(teacher.id)).map((school) => school.id)).not.toContain(futureSchool.id);
    await expect(resolveActiveSchoolMembership({ userId: teacher.id, schoolId: randomUUID() })).resolves.toBeNull();

    await suspendSchoolMembership({ actor: admin, membershipId: teacherB.id, revision: teacherB.revision });
    await expect(resolveActiveSchoolMembership({ userId: teacher.id, schoolId: schoolB.id })).resolves.toBeNull();
    const availableSchoolIds = (await listAvailableSchools(teacher.id)).map((school) => school.id);
    expect(availableSchoolIds).toContain(schoolA.id);
    expect(availableSchoolIds).not.toContain(schoolB.id);
    expect(availableSchoolIds).not.toContain(futureSchool.id);
  });

  it("uses optimistic revision and prevents inactivation while current memberships exist", async () => {
    await expect(updateSchool({ actor: admin, schoolId: schoolA.id, revision: schoolA.revision, name: schoolA.name, status: "INACTIVE" }))
      .rejects.toMatchObject({ code: "STATE_CONFLICT" });

    await suspendSchoolMembership({ actor: admin, membershipId: teacherA.id, revision: teacherA.revision });
    await suspendSchoolMembership({ actor: admin, membershipId: coordinatorA.id, revision: coordinatorA.revision });
    const updated = await updateSchool({ actor: admin, schoolId: schoolA.id, revision: schoolA.revision, name: "Escola Azul Atualizada", status: "INACTIVE" });
    expect(updated).toMatchObject({ status: "INACTIVE", revision: schoolA.revision + 1 });
    await expect(updateSchool({ actor: admin, schoolId: schoolA.id, revision: schoolA.revision, name: "Revisão velha", status: "ACTIVE" }))
      .rejects.toMatchObject({ code: "STATE_CONFLICT" });
  });
});
