import { describe, expect, it } from "vitest";
import { schoolDestinationForRole } from "../../src/server/schools/context";
import {
  assertSchoolMembership,
  type AuthenticatedPrincipal,
} from "../../src/server/auth/policies";

const adult: AuthenticatedPrincipal = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Pessoa adulta",
  globalRole: null,
  studentCode: null,
};

describe("school context primitives", () => {
  it("maps a server-confirmed local role to its existing dashboard", () => {
    expect(schoolDestinationForRole("TEACHER")).toBe("/professor");
    expect(schoolDestinationForRole("COORDINATOR")).toBe("/escola");
  });

  it("does not accept a membership from another school or user", () => {
    const membership = { userId: adult.id, schoolId: "school-a", role: "TEACHER" as const };
    expect(assertSchoolMembership(adult, membership, "school-a", ["TEACHER"]).membership).toBe(membership);
    expect(() => assertSchoolMembership(adult, membership, "school-b", ["TEACHER"]))
      .toThrowError("Vínculo escolar não autorizado.");
  });
});
