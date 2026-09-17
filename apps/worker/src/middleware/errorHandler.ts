import type { Context, ErrorHandler } from "hono";
import {
  AuthorizationError,
  AuthenticationError,
  NotFoundError,
  ValidationError,
  ConflictError,
  RateLimitError,
} from "@forge/auth";
import type { Env, HonoVariables } from "../types";
import type { ApiError } from "@forge/types";

export const globalErrorHandler: ErrorHandler<{
  Bindings: Env;
  Variables: HonoVariables;
}> = (error, c) => {
  const requestId = c.get("requestId") ?? "unknown";

  if (error instanceof AuthenticationError) {
    const body: ApiError = { success: false, error: { code: "UNAUTHORIZED", message: error.message } };
    return c.json(body, 401);
  }
  if (error instanceof AuthorizationError) {
    const body: ApiError = { success: false, error: { code: "FORBIDDEN", message: error.message } };
    return c.json(body, 403);
  }
  if (error instanceof NotFoundError) {
    const body: ApiError = { success: false, error: { code: "NOT_FOUND", message: error.message } };
    return c.json(body, 404);
  }
  if (error instanceof ConflictError) {
    const body: ApiError = { success: false, error: { code: "CONFLICT", message: error.message } };
    return c.json(body, 409);
  }
  if (error instanceof ValidationError) {
    const body: ApiError = {
      success: false,
      error: { code: "VALIDATION_ERROR", message: error.message, details: error.details },
    };
    return c.json(body, 422);
  }
  if (error instanceof RateLimitError) {
    const body: ApiError = { success: false, error: { code: "RATE_LIMITED", message: error.message } };
    return c.json(body, 429);
  }

  // Unexpected error — log internally, return generic message
  console.error(`[${requestId}] Unhandled error:`, error);

  const body: ApiError = {
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred. Please try again.",
    },
  };
  return c.json(body, 500);
};
