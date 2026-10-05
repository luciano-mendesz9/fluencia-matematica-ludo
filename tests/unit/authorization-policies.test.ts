import { describe, expect, it } from "vitest";
import { AuthorizationError } from "../../src/server/auth/errors";
import {
  assertClassAssignment,
  assertGlobalRole,
  assertSchoolMembership,
  type AuthenticatedPrincipal,
} from "../../src/server/auth/policies";
import { newPasswordSchema } from "../../src/server/auth/password-policy";

const professor: AuthenticatedPrincipal = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Professor",
  globalRole: null,
  studentCode: null,
};

describe("authorization policies", () => {
  it("allows only an explicitly accepted global role", () => {
    const admin = { ...professor, globalRole: "SEMED_ADMIN" as const };
    expect(assertGlobalRole(admin, ["SEMED_ADMIN"])).toBe(admin);
    expect(() => assertGlobalRole(professor, ["SEMED_ADMIN"])).toThrowError(AuthorizationError);
  });

  it("requires the membership to match user, school and local role", () => {
    const membership = { userId: professor.id, schoolId: "school-a", role: "TEACHER" as const };
    expect(assertSchoolMembership(professor, membership, "school-a", ["TEACHER"]).membership).toBe(membership);
    expect(() => assertSchoolMembership(professor, membership, "school-b", ["TEACHER"]))
      .toThrowError("Vínculo escolar não autorizado.");
    expect(() => assertSchoolMembership(professor, membership, "school-a", ["COORDINATOR"]))
      .toThrowError("Vínculo escolar não autorizado.");
  });

  it("requires a current assignment for the same teacher and class", () => {
    const assignment = { teacherId: professor.id, classId: "class-a", schoolId: "school-a" };
    expect(assertClassAssignment(professor, assignment, "class-a").assignment).toBe(assignment);
    expect(() => assertClassAssignment(professor, assignment, "class-b"))
      .toThrowError("Atribuição de turma não autorizada.");
  });

  it("enforces the password policy in server code", () => {
    expect(newPasswordSchema.safeParse("curta1").success).toBe(false);
    expect(newPasswordSchema.safeParse("somenteletraslongas").success).toBe(false);
    expect(newPasswordSchema.safeParse("Senha-Nova-2026").success).toBe(true);
  });
});
