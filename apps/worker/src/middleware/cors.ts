import { cors } from "hono/cors";
import type { Env, HonoVariables } from "../types";
import type { MiddlewareHandler } from "hono";

/**
 * CORS — only allow requests from the deployed frontend.
 * In development the frontend runs on localhost:5173.
 */
export function buildCors(env: Env): MiddlewareHandler<{ Bindings: Env; Variables: HonoVariables }> {
  const allowedOrigins =
    env.ENVIRONMENT === "production"
      ? ["https://theguild.example.com"]
      : env.ENVIRONMENT === "staging"
        ? ["https://staging.theguild.example.com"]
        : ["http://localhost:5173", "http://localhost:4173"];

  return cors({
    origin: allowedOrigins,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    exposeHeaders: ["X-Request-Id", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
    credentials: true,
    maxAge: 86400,
  });
}
