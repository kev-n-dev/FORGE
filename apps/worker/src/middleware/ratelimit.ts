import type { MiddlewareHandler } from "hono";
import { checkRateLimit, rateLimitKey } from "../utils/ratelimit";
import { RATE_LIMITS } from "@forge/config";
import type { Env, HonoVariables } from "../types";
import { err } from "../utils/response";

type AppMiddleware = MiddlewareHandler<{ Bindings: Env; Variables: HonoVariables }>;

function makeRateLimiter(category: keyof typeof RATE_LIMITS): AppMiddleware {
  return async (c, next) => {
    const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
    const key = await rateLimitKey(category, ip);
    const result = await checkRateLimit(c.env.SESSION_KV, key, RATE_LIMITS[category]);

    // Always set headers so clients can self-throttle
    c.header("X-RateLimit-Limit", String(RATE_LIMITS[category].requests));
    c.header("X-RateLimit-Remaining", String(result.remaining));
    c.header("X-RateLimit-Reset", String(result.resetAt));

    if (!result.allowed) {
      return err(c, "RATE_LIMITED", "Too many requests. Please try again later.", 429);
    }

    await next();
  };
}

export const apiRateLimit = makeRateLimiter("api");
export const authRateLimit = makeRateLimiter("auth");
export const reviewRateLimit = makeRateLimiter("review");
export const reportRateLimit = makeRateLimiter("report");
export const searchRateLimit = makeRateLimiter("search");
