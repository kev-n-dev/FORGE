import type { FeatureFlags } from "@forge/types";

/**
 * Default feature flag state (Phase 1 — Foundation only).
 * Individual flags are overridden by database values loaded at runtime.
 * This provides a safe fallback if the DB is unavailable.
 */
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  MARKETPLACE_ENABLED: false,
  JOBS_ENABLED: false,
  MESSAGING_ENABLED: false,
  RECOMMENDATIONS_ENABLED: false,
  MENTORSHIP_ENABLED: false,
  ADVERTISING_ENABLED: false,
  PAYMENTS_ENABLED: false,
  SOCIAL_FEED_ENABLED: false,
};

/**
 * Merge database-loaded flags over defaults.
 * Any flag not present in the DB falls back to the default.
 */
export function resolveFeatureFlags(
  dbFlags: Partial<FeatureFlags>
): FeatureFlags {
  return { ...DEFAULT_FEATURE_FLAGS, ...dbFlags };
}

/**
 * Parse raw feature flag rows from D1 into a partial FeatureFlags object.
 */
export function parseDbFeatureFlags(
  rows: Array<{ key: string; enabled: number }>
): Partial<FeatureFlags> {
  const out: Partial<FeatureFlags> = {};
  for (const row of rows) {
    if (row.key in DEFAULT_FEATURE_FLAGS) {
      (out as Record<string, boolean>)[row.key] = row.enabled === 1;
    }
  }
  return out;
}
