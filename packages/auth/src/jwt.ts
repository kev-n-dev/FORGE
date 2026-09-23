/**
 * Minimal JWT implementation using Web Crypto (HMAC-SHA256).
 * No external dependencies — fully compatible with Cloudflare Workers.
 *
 * We issue short-lived access tokens (15 min) and longer refresh tokens (7 days).
 * Tokens are signed with the AUTH_SECRET environment variable.
 */

import type { UserRole } from "@guild/types";

export interface AccessTokenPayload {
  sub: string; // userId
  email: string;
  role: UserRole;
  sessionId: string;
  type: "access";
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  sub: string; // userId
  sessionId: string;
  type: "refresh";
  iat: number;
  exp: number;
}

export type TokenPayload = AccessTokenPayload | RefreshTokenPayload;

const ACCESS_TTL_SECONDS = 15 * 60; // 15 minutes
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

function base64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function base64urlDecode(s: string): Uint8Array {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function encodePayload(payload: object): string {
  return base64url(new TextEncoder().encode(JSON.stringify(payload)).buffer as ArrayBuffer);
}

const HEADER = base64url(
  new TextEncoder().encode(JSON.stringify({ alg: "HS256", typ: "JWT" })).buffer as ArrayBuffer
);

export async function signToken(payload: object, secret: string): Promise<string> {
  const body = `${HEADER}.${encodePayload(payload)}`;
  const key = await importKey(secret);
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body)
  );
  return `${body}.${base64url(sig)}`;
}

export async function verifyToken<T extends TokenPayload>(
  token: string,
  secret: string
): Promise<T | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts as [string, string, string];
  const key = await importKey(secret);

  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    base64urlDecode(signature).buffer as ArrayBuffer,
    new TextEncoder().encode(`${header}.${payload}`)
  );
  if (!valid) return null;

  let decoded: T;
  try {
    decoded = JSON.parse(
      new TextDecoder().decode(base64urlDecode(payload))
    ) as T;
  } catch {
    return null;
  }

  if (decoded.exp < Math.floor(Date.now() / 1000)) return null;

  return decoded;
}

export async function createAccessToken(
  params: {
    userId: string;
    email: string;
    role: UserRole;
    sessionId: string;
  },
  secret: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: AccessTokenPayload = {
    sub: params.userId,
    email: params.email,
    role: params.role,
    sessionId: params.sessionId,
    type: "access",
    iat: now,
    exp: now + ACCESS_TTL_SECONDS,
  };
  return signToken(payload, secret);
}

export async function createRefreshToken(
  params: { userId: string; sessionId: string },
  secret: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: RefreshTokenPayload = {
    sub: params.userId,
    sessionId: params.sessionId,
    type: "refresh",
    iat: now,
    exp: now + REFRESH_TTL_SECONDS,
  };
  return signToken(payload, secret);
}

export function getTokenExpiry(ttlSeconds = ACCESS_TTL_SECONDS): number {
  return Math.floor(Date.now() / 1000) + ttlSeconds;
}

export { ACCESS_TTL_SECONDS, REFRESH_TTL_SECONDS };
