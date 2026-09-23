/**
 * Reports routes
 * POST /api/reports — submit a report
 */
import { Hono } from "hono";
import { createReport } from "@forge/database";
import { CreateReportSchema } from "@forge/validation";
import { verifyTurnstile } from "@forge/auth";
import type { Env, HonoVariables } from "../types";
import { ok, err } from "../utils/response";
import { validate } from "../utils/validate";
import { requireAuth } from "../middleware/auth";
import { reportRateLimit } from "../middleware/ratelimit";

const reports = new Hono<{ Bindings: Env; Variables: HonoVariables }>();

reports.post("/", requireAuth, reportRateLimit, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = validate(CreateReportSchema, body);
  if (!parsed.success) return err(c, "VALIDATION_ERROR", "Validation failed", 422, parsed.errors);

  const ip = c.req.header("CF-Connecting-IP");
  const ts = await verifyTurnstile(parsed.data.turnstileToken, c.env.TURNSTILE_SECRET, ip);
  if (!ts.success) return err(c, "CAPTCHA_FAILED", "CAPTCHA verification failed.", 400);

  await createReport(c.env.DB, {
    reporterId: c.get("userId"),
    targetType: parsed.data.targetType,
    targetId: parsed.data.targetId,
    reason: parsed.data.reason,
    description: parsed.data.description,
  });

  return ok(c, { message: "Report submitted. Our team will review it." });
});

export { reports as reportsRouter };
