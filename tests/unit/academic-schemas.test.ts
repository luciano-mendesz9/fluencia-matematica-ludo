import { describe, expect, it } from "vitest";
import {
  createAcademicYearSchema,
  createClassGroupSchema,
  updateAcademicYearSchema,
  updateClassGroupSchema,
} from "../../src/features/academics/schemas";

const schoolId = "11111111-1111-4111-8111-111111111111";
const academicYearId = "22222222-2222-4222-8222-222222222222";
const classGroupId = "33333333-3333-4333-8333-333333333333";

describe("academic forms", () => {
  it("accepts the supported academic year range and coerces form values", () => {
    expect(createAcademicYearSchema.parse({ schoolId, year: "2026" })).toEqual({ schoolId, year: 2026 });
    expect(createAcademicYearSchema.safeParse({ schoolId, year: "1999" }).success).toBe(false);
    expect(updateAcademicYearSchema.safeParse({ schoolId, academicYearId, revision: "1", year: "2101", status: "ACTIVE" }).success).toBe(false);
  });

  it("accepts only grades 1 to 5 and a named class", () => {
    expect(createClassGroupSchema.parse({ schoolId, academicYearId, grade: "3", name: "Turma A" }))
      .toEqual({ schoolId, academicYearId, grade: 3, name: "Turma A" });
    expect(createClassGroupSchema.safeParse({ schoolId, academicYearId, grade: "6", name: "Turma A" }).success).toBe(false);
    expect(createClassGroupSchema.safeParse({ schoolId, academicYearId, grade: "1", name: "" }).success).toBe(false);
  });

  it("requires optimistic revisions and known statuses for updates", () => {
    expect(updateClassGroupSchema.safeParse({
      schoolId,
      classGroupId,
      academicYearId,
      revision: "0",
      grade: "2",
      name: "Turma B",
      status: "ACTIVE",
    }).success).toBe(false);
    expect(updateClassGroupSchema.safeParse({
      schoolId,
      classGroupId,
      academicYearId,
      revision: "2",
      grade: "2",
      name: "Turma B",
      status: "ARCHIVED",
    }).success).toBe(false);
  });
});
