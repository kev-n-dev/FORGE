import type { MiddlewareHandler } from "hono";
import { isAdmin, isSuperAdmin } from "@forge/auth";
import type { UserRole } from "@forge/types";
import type { Env, HonoVariables } from "../types";
import { err } from "../utils/response";

type AppMiddleware = MiddlewareHandler<{ Bindings: Env; Variables: HonoVariables }>;

export const requireAdmin: AppMiddleware = async (c, next) => {
  const role = c.get("userRole") as UserRole | undefined;
  if (!role || !isAdmin(role)) {
    return err(c, "FORBIDDEN", "Admin access required.", 403);
  }
  await next();
};

export const requireSuperAdmin: AppMiddleware = async (c, next) => {
  const role = c.get("userRole") as UserRole | undefined;
  if (!role || !isSuperAdmin(role)) {
    return err(c, "FORBIDDEN", "Super-admin access required.", 403);
  }
  await next();
};
