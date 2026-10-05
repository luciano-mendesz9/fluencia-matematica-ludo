import { jwtVerify, SignJWT } from "jose";
import { AUTH_AUDIENCE, AUTH_ISSUER } from "./constants";
import { getJwtSecret } from "./config";

export type SessionJwt = {
  userId: string;
  sessionId: string;
  sessionVersion: number;
  issuedAt: number;
  expiresAt: number;
};

export async function signSessionJwt(claims: SessionJwt) {
  return new SignJWT({ sv: claims.sessionVersion })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(AUTH_ISSUER)
    .setAudience(AUTH_AUDIENCE)
    .setSubject(claims.userId)
    .setJti(claims.sessionId)
    .setIssuedAt(claims.issuedAt)
    .setExpirationTime(claims.expiresAt)
    .sign(getJwtSecret());
}

export async function verifySessionJwt(token: string): Promise<SessionJwt | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: ["HS256"],
      issuer: AUTH_ISSUER,
      audience: AUTH_AUDIENCE,
    });
    if (!payload.sub || !payload.jti || typeof payload.sv !== "number" || !payload.iat || !payload.exp) return null;
    return {
      userId: payload.sub,
      sessionId: payload.jti,
      sessionVersion: payload.sv,
      issuedAt: payload.iat,
      expiresAt: payload.exp,
    };
  } catch {
    return null;
  }
}
