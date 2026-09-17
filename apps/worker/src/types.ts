/**
 * Cloudflare Worker bindings and Hono context types.
 */
import type { UserRole } from "@forge/types";

/** Matches the [vars] / bindings in wrangler.toml */
export interface Env {
  // D1 Database
  DB: D1Database;

  // KV Namespaces
  SESSION_KV: KVNamespace;
  CACHE_KV: KVNamespace;

  // R2 Buckets
  MEDIA_BUCKET: R2Bucket;
  PRIVATE_BUCKET: R2Bucket; // Verification documents — never public

  // Queues
  NOTIFICATION_QUEUE: Queue;
  MODERATION_QUEUE: Queue;

  // Environment
  ENVIRONMENT: "development" | "staging" | "production";

  // Secrets
  AUTH_SECRET: string;
  TURNSTILE_SECRET: string;

  // Cloudflare Turnstile site key (public — used in error responses)
  TURNSTILE_SITE_KEY: string;

  // R2 public base URL
  MEDIA_BASE_URL: string;
}

/** Variables set on Hono context by middleware */
export interface HonoVariables {
  userId: string;
  userEmail: string;
  userRole: UserRole;
  sessionId: string;
  requestId: string;
}
