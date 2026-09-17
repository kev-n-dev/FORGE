/**
 * Short-lived one-time token generation for email verification and password reset.
 * Tokens are cryptographically random, hashed before storage (same pattern as OAuth PKCE).
 * The raw token is sent to the user; only the hash is stored in D1.
 */

const TOKEN_BYTES = 32; // 256-bit raw token

/**
 * Generate a cryptographically random URL-safe token.
 * Returns both the raw token (to send to user) and its SHA-256 hash (to store in DB).
 */
export async function generateToken(): Promise<{ raw: string; hash: string }> {
  const bytes = crypto.getRandomValues(new Uint8Array(TOKEN_BYTES));
  const raw = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const hashBuf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(raw)
  );
  const hash = Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return { raw, hash };
}

/**
 * Hash a raw token for lookup (e.g. when verifying a link the user clicked).
 */
export async function hashToken(raw: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(raw)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generate a new session ID.
 */
export function generateSessionId(): string {
  return crypto.randomUUID();
}

/**
 * Expiry helpers.
 */
export function expiresInMinutes(minutes: number): string {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

export function expiresInHours(hours: number): string {
  return expiresInMinutes(hours * 60);
}

export function isExpired(isoString: string): boolean {
  return new Date(isoString) < new Date();
}
