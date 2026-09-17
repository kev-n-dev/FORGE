/**
 * Type-safe API client for the FORGE Worker API.
 * Handles token refresh, error normalisation, and request/response typing.
 */

import type { ApiResponse, ApiError } from "@forge/types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

// ---------------------------------------------------------------------------
// Token storage — memory-first with sessionStorage fallback
// Never store tokens in localStorage (XSS risk)
// ---------------------------------------------------------------------------
let _accessToken: string | null = null;
let _refreshToken: string | null = null;

export function setTokens(access: string, refresh: string): void {
  _accessToken = access;
  _refreshToken = refresh;
  // Store refresh token in sessionStorage (cleared on tab close)
  sessionStorage.setItem("forge_rt", refresh);
}

export function clearTokens(): void {
  _accessToken = null;
  _refreshToken = null;
  sessionStorage.removeItem("forge_rt");
}

export function getAccessToken(): string | null {
  return _accessToken;
}

// Restore refresh token from sessionStorage on page load
export function restoreRefreshToken(): string | null {
  _refreshToken = sessionStorage.getItem("forge_rt");
  return _refreshToken;
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------
export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function tryRefreshToken(): Promise<boolean> {
  const rt = _refreshToken ?? restoreRefreshToken();
  if (!rt) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) {
      clearTokens();
      return false;
    }
    const data = (await res.json()) as ApiResponse<{ accessToken: string; refreshToken: string }>;
    if (data.success) {
      setTokens(data.data.accessToken, data.data.refreshToken);
      return true;
    }
  } catch {
    clearTokens();
  }
  return false;
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  skipRefresh?: boolean;
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth, skipRefresh, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (!skipAuth && _accessToken) {
    headers["Authorization"] = `Bearer ${_accessToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers });

  // Token expired — attempt refresh once
  if (res.status === 401 && !skipRefresh && !skipAuth) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${_accessToken}`;
      const retryRes = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers });
      return handleResponse<T>(retryRes);
    }
    clearTokens();
    // Emit a custom event so the auth store can react
    window.dispatchEvent(new CustomEvent("forge:session-expired"));
  }

  return handleResponse<T>(res);
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as unknown as T;

  let body: ApiResponse<T>;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiClientError("PARSE_ERROR", "Failed to parse server response.", res.status);
  }

  if (!body.success) {
    const e = (body as ApiError).error;
    throw new ApiClientError(e.code, e.message, res.status, e.details);
  }

  return (body as { success: true; data: T }).data;
}

// ---------------------------------------------------------------------------
// Convenience methods
// ---------------------------------------------------------------------------
export const api = {
  get: <T>(path: string, opts?: RequestOptions) =>
    apiFetch<T>(path, { method: "GET", ...opts }),

  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    apiFetch<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...opts,
    }),

  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    apiFetch<T>(path, {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...opts,
    }),

  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    apiFetch<T>(path, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...opts,
    }),

  delete: <T>(path: string, opts?: RequestOptions) =>
    apiFetch<T>(path, { method: "DELETE", ...opts }),
};
