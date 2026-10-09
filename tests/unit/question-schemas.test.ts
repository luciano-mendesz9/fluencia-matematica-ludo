import { describe, expect, it } from "vitest";
import { createQuestionSchema, createVersionSchema, questionFiltersSchema } from "../../src/features/questions/schemas";

const themeId = "11111111-1111-4111-8111-111111111111";
const skillId = "22222222-2222-4222-8222-222222222222";

describe("question bank forms", () => {
  it("accepts the author-rated difficulty from 1 to 6 and an optional skill", () => {
    expect(createQuestionSchema.parse({ grade: "1", difficulty: "6", themeId, skillId: "", statement: "Quanto é 2 + 2?" })).toMatchObject({ grade: 1, difficulty: 6, skillId: null });
    expect(createQuestionSchema.safeParse({ grade: "1", difficulty: "7", themeId, skillId, statement: "Quanto é 2 + 2?" }).success).toBe(false);
  });

  it("requires optimistic revision for a new version", () => {
    expect(createVersionSchema.safeParse({ questionId: skillId, revision: "0", grade: "2", difficulty: "3", themeId, skillId: "", statement: "Resolva a expressão." }).success).toBe(false);
  });

  it("ignores malformed optional URL filters instead of broadening writes", () => {
    expect(questionFiltersSchema.parse({ grade: "9", difficulty: "2", origin: "PRIVATE" })).toEqual({ grade: undefined, difficulty: 2, origin: "PRIVATE" });
  });
});
