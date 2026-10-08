import { describe, expect, it } from "vitest";
import {
  createGlobalAdultSchema,
  createLocalAdultSchema,
  createTeacherAssignmentSchema,
  endTeacherAssignmentSchema,
  suspendLocalMembershipSchema,
} from "../../src/features/people/schemas";

const schoolId = "11111111-1111-4111-8111-111111111111";
const membershipId = "22222222-2222-4222-8222-222222222222";
const classId = "33333333-3333-4333-8333-333333333333";
const assignmentId = "44444444-4444-4444-8444-444444444444";
const password = "Senha-Temporaria-2026";

describe("adult and teacher assignment forms", () => {
  it("validates global roles and matching passwords", () => {
    expect(createGlobalAdultSchema.safeParse({ name: "Admin", email: "admin@example.invalid", globalRole: "SEMED_ADMIN", temporaryPassword: password, confirmPassword: password }).success).toBe(true);
    expect(createGlobalAdultSchema.safeParse({ name: "Admin", email: "admin@example.invalid", globalRole: "COORDINATOR", temporaryPassword: password, confirmPassword: password }).success).toBe(false);
    expect(createGlobalAdultSchema.safeParse({ name: "Admin", email: "admin@example.invalid", globalRole: "DEVELOPER", temporaryPassword: password, confirmPassword: "Outra-Senha-2026" }).success).toBe(false);
  });

  it("accepts only local school roles for a new adult", () => {
    expect(createLocalAdultSchema.safeParse({ schoolId, name: "Professor", email: "teacher@example.invalid", role: "TEACHER", temporaryPassword: password, confirmPassword: password }).success).toBe(true);
    expect(createLocalAdultSchema.safeParse({ schoolId, name: "Professor", email: "teacher@example.invalid", role: "SEMED_ADMIN", temporaryPassword: password, confirmPassword: password }).success).toBe(false);
  });

  it("requires a valid class and optional ISO date for assignment", () => {
    expect(createTeacherAssignmentSchema.parse({ schoolId, membershipId, classId, endsOn: "2027-12-31" })).toEqual({ schoolId, membershipId, classId, endsOn: "2027-12-31" });
    expect(createTeacherAssignmentSchema.safeParse({ schoolId, membershipId, classId, endsOn: "31/12/2027" }).success).toBe(false);
  });

  it("requires explicit confirmation and optimistic revision for revocation", () => {
    expect(suspendLocalMembershipSchema.safeParse({ schoolId, membershipId, revision: "1", confirmation: "yes" }).success).toBe(true);
    expect(suspendLocalMembershipSchema.safeParse({ schoolId, membershipId, revision: "1", confirmation: null }).success).toBe(false);
    expect(endTeacherAssignmentSchema.safeParse({ schoolId, assignmentId, revision: "0", confirmation: "yes" }).success).toBe(false);
  });
});
