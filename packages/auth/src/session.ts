/**
 * Server-side session management using Cloudflare KV.
 *
 * Sessions are stored in KV with the key: `session:<sessionId>`
 * Refresh token rotates on use (refresh token rotation).
 * All previous refresh tokens for a session are invalidated on rotation.
 */

import type { UserRole } from "@guild/types";

export interface SessionData {
  userId: string;
  email: string;
  role: UserRole;
  sessionId: string;
  refreshTokenHash: string; // SHA-256 hash of the current refresh token
  createdAt: number;
  lastUsedAt: number;
  userAgent: string | null;
  ipHash: string | null; // Hashed IP for fraud detection, never stored as plain
}

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const SESSION_KEY_PREFIX = "session:";

async function sha256Hex(value: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSession(
  kv: KVNamespace,
  params: {
    userId: string;
    email: string;
    role: UserRole;
    sessionId: string;
    refreshToken: string;
    userAgent: string | null;
    ip: string | null;
  }
): Promise<void> {
  const refreshTokenHash = await sha256Hex(params.refreshToken);
  const ipHash = params.ip ? await sha256Hex(params.ip) : null;

  const session: SessionData = {
    userId: params.userId,
    email: params.email,
    role: params.role,
    sessionId: params.sessionId,
    refreshTokenHash,
    createdAt: Date.now(),
    lastUsedAt: Date.now(),
    userAgent: params.userAgent,
    ipHash,
  };

  await kv.put(
    `${SESSION_KEY_PREFIX}${params.sessionId}`,
    JSON.stringify(session),
    { expirationTtl: SESSION_TTL_SECONDS }
  );
}

export async function getSession(
  kv: KVNamespace,
  sessionId: string
): Promise<SessionData | null> {
  const raw = await kv.get(`${SESSION_KEY_PREFIX}${sessionId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

/**
 * Validate a refresh token against the stored session.
 * Returns the session on success, null on failure.
 * Invalid token attempts should be treated as possible token theft.
 */
export async function validateRefreshToken(
  kv: KVNamespace,
  sessionId: string,
  refreshToken: string
): Promise<SessionData | null> {
  const session = await getSession(kv, sessionId);
  if (!session) return null;

  const hash = await sha256Hex(refreshToken);

  // Constant-time comparison
  const a = new TextEncoder().encode(hash);
  const b = new TextEncoder().encode(session.refreshTokenHash);
  if (a.length !== b.length) {
    // Token mismatch — possible theft; invalidate the session
    await deleteSession(kv, sessionId);
    return null;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  if (diff !== 0) {
    // Token mismatch — invalidate session (refresh token rotation violation)
    await deleteSession(kv, sessionId);
    return null;
  }

  return session;
}

/**
 * Rotate the refresh token — store the new hash, extend TTL.
 */
export async function rotateRefreshToken(
  kv: KVNamespace,
  sessionId: string,
  newRefreshToken: string
): Promise<void> {
  const session = await getSession(kv, sessionId);
  if (!session) return;

  const newHash = await sha256Hex(newRefreshToken);
  const updated: SessionData = {
    ...session,
    refreshTokenHash: newHash,
    lastUsedAt: Date.now(),
  };

  await kv.put(
    `${SESSION_KEY_PREFIX}${sessionId}`,
    JSON.stringify(updated),
    { expirationTtl: SESSION_TTL_SECONDS }
  );
}

export async function deleteSession(kv: KVNamespace, sessionId: string): Promise<void> {
  await kv.delete(`${SESSION_KEY_PREFIX}${sessionId}`);
}

/**
 * Delete ALL sessions for a user (e.g. on password change or ban).
 * Note: KV doesn't support key-range deletes natively.
 * We use a user-sessions index key: `user_sessions:<userId>` → JSON array of sessionIds.
 */
export async function deleteAllUserSessions(kv: KVNamespace, userId: string): Promise<void> {
  const indexKey = `user_sessions:${userId}`;
  const raw = await kv.get(indexKey);
  if (!raw) return;

  let sessionIds: string[] = [];
  try {
    sessionIds = JSON.parse(raw) as string[];
  } catch {
    return;
  }

  await Promise.all([
    ...sessionIds.map((id) => kv.delete(`${SESSION_KEY_PREFIX}${id}`)),
    kv.delete(indexKey),
  ]);
}

export async function registerSessionForUser(
  kv: KVNamespace,
  userId: string,
  sessionId: string
): Promise<void> {
  const indexKey = `user_sessions:${userId}`;
  const raw = await kv.get(indexKey);
  let sessions: string[] = [];
  if (raw) {
    try {
      sessions = JSON.parse(raw) as string[];
    } catch {
      sessions = [];
    }
  }
  sessions.push(sessionId);
  // Keep only last 10 sessions to bound storage
  if (sessions.length > 10) sessions = sessions.slice(-10);
  await kv.put(indexKey, JSON.stringify(sessions), {
    expirationTtl: SESSION_TTL_SECONDS,
  });
}
