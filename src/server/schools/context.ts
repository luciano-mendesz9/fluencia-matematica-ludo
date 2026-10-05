import "server-only";

import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { AUTH_ISSUER, SCHOOL_CONTEXT_COOKIE_NAME } from "@/src/server/auth/constants";
import { getJwtSecret, shouldUseSecureAuthCookie } from "@/src/server/auth/config";
import { listAvailableSchools } from "./service";

const SCHOOL_CONTEXT_AUDIENCE = "fluencia-matematica-school-context";
const SCHOOL_CONTEXT_DURATION_SECONDS = 30 * 24 * 60 * 60;

export function schoolDestinationForRole(role: "COORDINATOR" | "TEACHER") {
  return role === "COORDINATOR" ? "/escola" as const : "/professor" as const;
}

async function signSchoolContext(userId: string, schoolId: string) {
  return new SignJWT({ schoolId })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(AUTH_ISSUER)
    .setAudience(SCHOOL_CONTEXT_AUDIENCE)
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SCHOOL_CONTEXT_DURATION_SECONDS}s`)
    .sign(getJwtSecret());
}

async function verifySchoolContext(token: string, userId: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: ["HS256"],
      issuer: AUTH_ISSUER,
      audience: SCHOOL_CONTEXT_AUDIENCE,
      subject: userId,
    });
    return typeof payload.schoolId === "string" ? payload.schoolId : null;
  } catch {
    return null;
  }
}

export async function setSchoolContextCookie(userId: string, schoolId: string) {
  const token = await signSchoolContext(userId, schoolId);
  (await cookies()).set(SCHOOL_CONTEXT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: shouldUseSecureAuthCookie(),
    sameSite: "lax",
    path: "/",
    maxAge: SCHOOL_CONTEXT_DURATION_SECONDS,
    priority: "high",
  });
}

export async function clearSchoolContextCookie() {
  (await cookies()).delete(SCHOOL_CONTEXT_COOKIE_NAME);
}

export async function getSelectedSchoolContext(userId: string) {
  const token = (await cookies()).get(SCHOOL_CONTEXT_COOKIE_NAME)?.value;
  const schoolId = token ? await verifySchoolContext(token, userId) : null;
  if (!schoolId) return null;
  const school = (await listAvailableSchools(userId)).find((option) => option.id === schoolId);
  if (!school) return null;
  return {
    schoolId: school.id,
    schoolName: school.name,
    role: school.role,
    destination: schoolDestinationForRole(school.role),
  };
}
