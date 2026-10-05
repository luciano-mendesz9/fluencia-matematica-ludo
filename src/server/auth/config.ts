const MINIMUM_JWT_SECRET_LENGTH = 32;

export function getJwtSecret() {
  const value = process.env.AUTH_JWT_SECRET;
  if (!value || new TextEncoder().encode(value).byteLength < MINIMUM_JWT_SECRET_LENGTH) {
    throw new Error("[auth] AUTH_JWT_SECRET deve conter ao menos 32 bytes.");
  }
  return new TextEncoder().encode(value);
}

export function getBcryptRounds() {
  const value = Number.parseInt(process.env.BCRYPT_ROUNDS ?? "12", 10);
  if (!Number.isInteger(value) || value < 10 || value > 15) {
    throw new Error("[auth] BCRYPT_ROUNDS deve ser um inteiro entre 10 e 15.");
  }
  return value;
}

export function shouldUseSecureAuthCookie() {
  return process.env.AUTH_COOKIE_SECURE !== "false";
}
