/**
 * Public config route — returns feature flags and platform info to the frontend.
 * GET /api/config
 */

import { Hono } from "hono";
import { dbAll } from "@guild/database";
import { parseDbFeatureFlags, resolveFeatureFlags } from "@guild/config";
import { PLATFORM } from "@guild/config";
import type { Env, HonoVariables } from "../types";
import { ok } from "../utils/response";

const config = new Hono<{ Bindings: Env; Variables: HonoVariables }>();

config.get("/", async (c) => {
  const rows = await dbAll<{ key: string; enabled: number }>(
    c.env.DB,
    "SELECT key, enabled FROM feature_flags"
  );
  const flags = resolveFeatureFlags(parseDbFeatureFlags(rows));

  return ok(c, {
    platform: {
      name: PLATFORM.name,
      tagline: PLATFORM.tagline,
      description: PLATFORM.description,
      environment: c.env.ENVIRONMENT,
    },
    features: flags,
    turnstileSiteKey: c.env.TURNSTILE_SITE_KEY,
  });
});

export { config as configRouter };
