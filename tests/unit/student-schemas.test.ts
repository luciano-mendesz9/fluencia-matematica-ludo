import { describe, expect, it } from "vitest";
import {
  createStudentSchema,
  endEnrollmentSchema,
  resetEnrolledStudentPasswordSchema,
  transferStudentSchema,
} from "../../src/features/students/schemas";

const schoolId = "11111111-1111-4111-8111-111111111111";
const studentId = "22222222-2222-4222-8222-222222222222";
const classId = "33333333-3333-4333-8333-333333333333";
const password = "Senha-Temporaria-2026";

describe("student and enrollment forms", () => {
  it("accepts an individual student with matching strong passwords", () => {
    expect(createStudentSchema.parse({
      schoolId,
      classId,
      name: "  Ana Souza  ",
      temporaryPassword: password,
      confirmPassword: password,
    })).toMatchObject({ schoolId, classId, name: "Ana Souza", temporaryPassword: password });
  });

  it("rejects a weak or mismatched temporary password", () => {
    expect(createStudentSchema.safeParse({ schoolId, classId, name: "Ana", temporaryPassword: "fraca", confirmPassword: "fraca" }).success).toBe(false);
    expect(createStudentSchema.safeParse({ schoolId, classId, name: "Ana", temporaryPassword: password, confirmPassword: `${password}!` }).success).toBe(false);
  });

  it("requires UUIDs and a positive optimistic revision for enrollment changes", () => {
    expect(transferStudentSchema.parse({ schoolId, studentId, targetClassId: classId, enrollmentRevision: "2" }))
      .toEqual({ schoolId, studentId, targetClassId: classId, enrollmentRevision: 2 });
    expect(endEnrollmentSchema.safeParse({ schoolId, studentId, enrollmentRevision: "0", confirmation: "yes" }).success).toBe(false);
    expect(endEnrollmentSchema.safeParse({ schoolId, studentId, enrollmentRevision: "1", confirmation: null }).success).toBe(false);
    expect(transferStudentSchema.safeParse({ schoolId, studentId: "aluno", targetClassId: classId, enrollmentRevision: "1" }).success).toBe(false);
  });

  it("validates matching passwords for an enrolled student reset", () => {
    expect(resetEnrolledStudentPasswordSchema.safeParse({ schoolId, studentId, newPassword: password, confirmPassword: password }).success).toBe(true);
    expect(resetEnrolledStudentPasswordSchema.safeParse({ schoolId, studentId, newPassword: password, confirmPassword: "Outra-Senha-2026" }).success).toBe(false);
  });
});
