export type AuthorizationErrorCode = "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION" | "STATE_CONFLICT";

export class AuthorizationError extends Error {
  constructor(public readonly code: AuthorizationErrorCode, message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}
