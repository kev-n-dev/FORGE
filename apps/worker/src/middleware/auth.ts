/**
 * Authentication middleware for Hono.
 * Validates the Bearer access token and populates HonoVariables.
 * Authorization decisions (ownership, roles) are made in each route handler.
 */

import type { MiddlewareHandler } from "hono";
import { verifyToken } from "@guild/auth";
import type { AccessTokenPayload } from "@guild/auth";
import type { Env, HonoVariables } from "../types";
import { err } from "../utils/response";

type AppMiddleware = MiddlewareHandler<{ Bindings: Env; Variables: HonoVariables }>;

/** Require a valid access token. Sets userId, userEmail, userRole, sessionId. */
export const requireAuth: AppMiddleware = async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return err(c, "UNAUTHORIZED", "Authentication required.", 401);
  }

  const token = authHeader.slice(7);
  const payload = await verifyToken<AccessTokenPayload>(token, c.env.AUTH_SECRET);

  if (!payload || payload.type !== "access") {
    return err(c, "INVALID_TOKEN", "Invalid or expired token.", 401);
  }

  c.set("userId", payload.sub);
  c.set("userEmail", payload.email);
  c.set("userRole", payload.role);
  c.set("sessionId", payload.sessionId);

  await next();
};

/** Require authentication but allow unauthenticated requests (sets variables if token present). */
export const optionalAuth: AppMiddleware = async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = await verifyToken<AccessTokenPayload>(token, c.env.AUTH_SECRET);
    if (payload && payload.type === "access") {
      c.set("userId", payload.sub);
      c.set("userEmail", payload.email);
      c.set("userRole", payload.role);
      c.set("sessionId", payload.sessionId);
    }
  }
  await next();
};
