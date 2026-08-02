export class AuthorizationError extends Error {
  constructor(
    message: string,
    public code: "UNAUTHORIZED" | "FORBIDDEN",
    public status: 401 | 403
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}
