/**
 * Simple sliding-window rate limiter using Cloudflare KV.
 * For high-traffic production use, upgrade to Cloudflare Rate Limiting API.
 */

export interface RateLimitConfig {
  requests: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix timestamp
}

/**
 * Check and increment a rate limit counter.
 * @param kv - KV namespace
 * @param key - Unique identifier (e.g. "rl:auth:<ip>")
 * @param config - Limit configuration
 */
export async function checkRateLimit(
  kv: KVNamespace,
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const windowKey = `${key}:${Math.floor(now / config.windowSeconds)}`;
  const resetAt = (Math.floor(now / config.windowSeconds) + 1) * config.windowSeconds;

  const rawCount = await kv.get(windowKey);
  const count = rawCount ? parseInt(rawCount, 10) : 0;

  if (count >= config.requests) {
    return { allowed: false, remaining: 0, resetAt };
  }

  // Increment — fire and forget to not block the request
  void kv.put(windowKey, String(count + 1), {
    expirationTtl: config.windowSeconds * 2,
  });

  return {
    allowed: true,
    remaining: config.requests - count - 1,
    resetAt,
  };
}

/**
 * Build a rate limit key from an IP address and category.
 * IP is hashed to avoid storing raw IPs in KV.
 */
export async function rateLimitKey(
  category: string,
  identifier: string
): Promise<string> {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(identifier)
  );
  const hex = Array.from(new Uint8Array(hash).slice(0, 8))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `rl:${category}:${hex}`;
}
