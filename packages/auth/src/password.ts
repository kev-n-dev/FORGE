/**
 * Password hashing using Web Crypto API (PBKDF2).
 * Available in Cloudflare Workers without any external dependencies.
 *
 * Format stored in DB: "pbkdf2:sha256:<iterations>:<salt_b64>:<hash_b64>"
 */

const ALGORITHM = "PBKDF2";
const HASH = "SHA-256";
const ITERATIONS = 310_000; // NIST-recommended 2024 minimum
const KEY_LENGTH = 32; // 256-bit derived key

function toBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function fromBase64(s: string): Uint8Array {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

/**
 * Hash a plaintext password.
 * Returns a self-describing string safe to store in the database.
 */
export async function hashPassword(plaintext: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(plaintext),
    ALGORITHM,
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: ALGORITHM,
      hash: HASH,
      salt,
      iterations: ITERATIONS,
    },
    keyMaterial,
    KEY_LENGTH * 8
  );
  const saltB64 = toBase64(salt.buffer);
  const hashB64 = toBase64(derived);
  return `pbkdf2:${HASH.toLowerCase()}:${ITERATIONS}:${saltB64}:${hashB64}`;
}

/**
 * Verify a plaintext password against a stored hash.
 * Uses a constant-time comparison to prevent timing attacks.
 */
export async function verifyPassword(plaintext: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 5 || parts[0] !== "pbkdf2") return false;

  const [, , iterStr, saltB64, hashB64] = parts;
  const iterations = parseInt(iterStr ?? "0", 10);
  if (!iterStr || !saltB64 || !hashB64 || iterations < 1) return false;

  // Cast to ArrayBuffer to satisfy BufferSource — Uint8Array<ArrayBufferLike>
  // is not assignable to BufferSource in strict TS 5.5+ with DOM lib.
  const salt = fromBase64(saltB64).buffer as ArrayBuffer;
  const expectedHash = fromBase64(hashB64);

  let keyMaterial: CryptoKey;
  try {
    keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(plaintext),
      ALGORITHM,
      false,
      ["deriveBits"]
    );
  } catch {
    return false;
  }

  const derived = await crypto.subtle.deriveBits(
    {
      name: ALGORITHM,
      hash: HASH,
      salt,
      iterations,
    },
    keyMaterial,
    KEY_LENGTH * 8
  );

  // Constant-time comparison
  const a = new Uint8Array(derived);
  const b = expectedHash;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}

/**
 * Check whether a stored hash needs to be re-hashed
 * (e.g. iteration count has been updated).
 */
export function needsRehash(stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 5) return true;
  const iterations = parseInt(parts[2] ?? "0", 10);
  return iterations < ITERATIONS;
}
