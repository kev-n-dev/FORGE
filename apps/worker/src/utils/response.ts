import type { ApiError, ApiSuccess, PaginatedResponse, PaginationMeta } from "@forge/types";
import type { Context } from "hono";
import type { Env, HonoVariables } from "../types";

type AppContext = Context<{ Bindings: Env; Variables: HonoVariables }>;

export function ok<T>(c: AppContext, data: T, status = 200): Response {
  const body: ApiSuccess<T> = { success: true, data };
  return c.json(body, status as 200);
}

export function created<T>(c: AppContext, data: T): Response {
  return ok(c, data, 201);
}

export function noContent(c: AppContext): Response {
  return c.body(null, 204);
}

export function paginated<T>(
  c: AppContext,
  items: T[],
  meta: PaginationMeta
): Response {
  const body: ApiSuccess<PaginatedResponse<T>> = {
    success: true,
    data: { items, pagination: meta },
  };
  return c.json(body, 200);
}

export function err(
  c: AppContext,
  code: string,
  message: string,
  status: 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 = 400,
  details?: Record<string, string[]>
): Response {
  const body: ApiError = {
    success: false,
    error: { code, message, ...(details ? { details } : {}) },
  };
  return c.json(body, status);
}

export function buildPaginationMeta(
  total: number,
  page: number,
  pageSize: number
): PaginationMeta {
  const totalPages = Math.ceil(total / pageSize);
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
