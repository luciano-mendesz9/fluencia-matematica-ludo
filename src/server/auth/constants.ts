export const SESSION_COOKIE_NAME = "fm_session";
export const SESSION_DURATION_SECONDS = 8 * 60 * 60;
export const AUTH_ISSUER = "fluencia-matematica";
export const AUTH_AUDIENCE = "fluencia-matematica-web";

export const protectedRoutePrefixes = ["/admin", "/professor", "/aluno", "/operacao"] as const;
