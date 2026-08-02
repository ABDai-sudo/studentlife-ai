export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function ok<T>(data: T, init?: ResponseInit): Response {
  return Response.json({ success: true, data } satisfies ApiSuccess<T>, {
    status: 200,
    ...init,
  });
}

export function created<T>(data: T): Response {
  return Response.json({ success: true, data } satisfies ApiSuccess<T>, {
    status: 201,
  });
}

export function fail(
  message: string,
  options?: {
    code?: string;
    status?: number;
    details?: unknown;
  },
  init?: ResponseInit
): Response {
  const status = options?.status ?? 400;
  return Response.json(
    {
      success: false,
      error: {
        code: options?.code ?? "BAD_REQUEST",
        message,
        details: options?.details,
      },
    } satisfies ApiError,
    { status, ...init }
  );
}

export function unauthorized(message = "Authentication required"): Response {
  return fail(message, { code: "UNAUTHORIZED", status: 401 });
}

export function forbidden(message = "Access denied"): Response {
  return fail(message, { code: "FORBIDDEN", status: 403 });
}

export function notFound(message = "Resource not found"): Response {
  return fail(message, { code: "NOT_FOUND", status: 404 });
}

export function conflict(message: string): Response {
  return fail(message, { code: "CONFLICT", status: 409 });
}

export function serverError(message = "Something went wrong"): Response {
  return fail(message, { code: "INTERNAL_ERROR", status: 500 });
}
