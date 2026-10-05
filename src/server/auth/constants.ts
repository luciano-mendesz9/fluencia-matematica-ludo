export const SESSION_COOKIE_NAME = "fm_session";
export const SCHOOL_CONTEXT_COOKIE_NAME = "fm_school_context";
export const SESSION_DURATION_SECONDS = 8 * 60 * 60;
export const AUTH_ISSUER = "fluencia-matematica";
export const AUTH_AUDIENCE = "fluencia-matematica-web";

export const protectedRoutePrefixes = ["/admin", "/escola", "/professor", "/aluno", "/operacao", "/selecionar-escola"] as const;
