/**
 * Platform-wide constants.
 * These can be promoted to DB-backed config in the future.
 */

export const PLATFORM = {
  name: "FORGE",
  tagline: "Build your reputation.",
  description: "The professional network for people who make, build and create.",
  url: "https://forge.example.com", // Override via env in production
  supportEmail: "support@forge.example.com",
  version: "0.1.0",
} as const;

/** Slug generation */
export const SLUG_MAX_LENGTH = 80;

/** Pagination defaults */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Rate limiting (requests per window) */
export const RATE_LIMITS = {
  /** General API */
  api: { requests: 100, windowSeconds: 60 },
  /** Auth endpoints — tighter */
  auth: { requests: 10, windowSeconds: 60 },
  /** Review submission */
  review: { requests: 5, windowSeconds: 300 },
  /** Report submission */
  report: { requests: 3, windowSeconds: 300 },
  /** Search */
  search: { requests: 60, windowSeconds: 60 },
} as const;

/** Profile slug generation: "marcus-woodworks-3a2f" format */
export function generateSlug(displayName: string, suffix?: string): string {
  const base = displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, SLUG_MAX_LENGTH - 5);
  const tail = suffix ?? crypto.randomUUID().slice(0, 4);
  return `${base}-${tail}`;
}

/** Supported currencies for initial launch */
export const SUPPORTED_CURRENCIES = ["TTD", "USD", "CAD", "GBP", "EUR"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCY: SupportedCurrency = "TTD";
