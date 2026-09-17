import type { MiddlewareHandler } from "hono";
import type { Env, HonoVariables } from "../types";

export const requestId: MiddlewareHandler<{ Bindings: Env; Variables: HonoVariables }> = async (
  c,
  next
) => {
  const id = c.req.header("X-Request-Id") ?? crypto.randomUUID();
  c.set("requestId", id);
  c.header("X-Request-Id", id);
  await next();
};
