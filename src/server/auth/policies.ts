import "server-only";

import type { GlobalRole } from "@/src/generated/prisma/enums";
import { AuthorizationError } from "./errors";
import { getCurrentSession } from "./session";

export type AuthenticatedPrincipal = {
  id: string;
  name: string;
  globalRole: GlobalRole | null;
  studentCode: string | null;
};

export type SchoolRole = "COORDINATOR" | "TEACHER";

export type ActiveSchoolMembership = {
  userId: string;
  schoolId: string;
  role: SchoolRole;
};

export type ActiveClassAssignment = {
  teacherId: string;
  classId: string;
  schoolId: string;
};

export type SchoolMembershipResolver = (input: {
  userId: string;
  schoolId: string;
}) => Promise<ActiveSchoolMembership | null>;

export type ClassAssignmentResolver = (input: {
  teacherId: string;
  classId: string;
}) => Promise<ActiveClassAssignment | null>;

export function assertGlobalRole(principal: AuthenticatedPrincipal, allowed: readonly GlobalRole[]) {
  if (!principal.globalRole || !allowed.includes(principal.globalRole)) {
    throw new AuthorizationError("FORBIDDEN", "Acesso não autorizado.");
  }
  return principal;
}

export function assertSchoolMembership(
  principal: AuthenticatedPrincipal,
  membership: ActiveSchoolMembership | null,
  schoolId: string,
  allowedRoles: readonly SchoolRole[],
) {
  if (
    !membership ||
    membership.userId !== principal.id ||
    membership.schoolId !== schoolId ||
    !allowedRoles.includes(membership.role)
  ) {
    throw new AuthorizationError("FORBIDDEN", "Vínculo escolar não autorizado.");
  }
  return { user: principal, membership };
}

export function assertClassAssignment(
  principal: AuthenticatedPrincipal,
  assignment: ActiveClassAssignment | null,
  classId: string,
) {
  if (!assignment || assignment.teacherId !== principal.id || assignment.classId !== classId) {
    throw new AuthorizationError("FORBIDDEN", "Atribuição de turma não autorizada.");
  }
  return { user: principal, assignment };
}

export async function requireUser(): Promise<AuthenticatedPrincipal> {
  const session = await getCurrentSession();
  if (!session) throw new AuthorizationError("UNAUTHENTICATED", "Autenticação necessária.");
  return {
    id: session.user.id,
    name: session.user.name,
    globalRole: session.user.globalRole,
    studentCode: session.user.studentCode,
  };
}

export async function requireGlobalRole(...allowed: GlobalRole[]) {
  return assertGlobalRole(await requireUser(), allowed);
}

export async function requireSchoolMembership(input: {
  schoolId: string;
  allowedRoles: readonly SchoolRole[];
  resolve: SchoolMembershipResolver;
}) {
  const principal = await requireUser();
  const membership = await input.resolve({ userId: principal.id, schoolId: input.schoolId });
  return assertSchoolMembership(principal, membership, input.schoolId, input.allowedRoles);
}

export async function requireClassAssignment(input: {
  classId: string;
  resolve: ClassAssignmentResolver;
}) {
  const principal = await requireUser();
  const assignment = await input.resolve({ teacherId: principal.id, classId: input.classId });
  return assertClassAssignment(principal, assignment, input.classId);
}
