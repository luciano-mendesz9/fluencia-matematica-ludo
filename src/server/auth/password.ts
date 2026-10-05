import "server-only";

import bcrypt from "bcrypt";
import { getBcryptRounds } from "./config";

const DUMMY_PASSWORD_HASH = "$2b$10$XhdmtkVyMhlsaC2e77VleeIt0P8v.mJfaP/enL1l09MRW7gU7zwXq";

export function hashPassword(password: string) {
  return bcrypt.hash(password, getBcryptRounds());
}

export function verifyPassword(password: string, passwordHash?: string | null) {
  return bcrypt.compare(password, passwordHash ?? DUMMY_PASSWORD_HASH);
}
