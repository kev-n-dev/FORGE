/**
 * Notifications routes
 * GET  /api/notifications         — list for current user
 * POST /api/notifications/:id/read — mark as read
 */
import { Hono } from "hono";
import { dbAll, dbRun, now } from "@guild/database";
import type { Env, HonoVariables } from "../types";
import { ok } from "../utils/response";
import { requireAuth } from "../middleware/auth";

const notifications = new Hono<{ Bindings: Env; Variables: HonoVariables }>();

notifications.use("*", requireAuth);

notifications.get("/", async (c) => {
  const items = await dbAll(
    c.env.DB,
    `SELECT id, type, title, body, action_url, is_read, created_at, read_at
     FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 50`,
    c.get("userId")
  );
  return ok(c, items);
});

notifications.post("/:id/read", async (c) => {
  await dbRun(
    c.env.DB,
    "UPDATE notifications SET is_read = 1, read_at = ? WHERE id = ? AND user_id = ?",
    now(),
    c.req.param("id"),
    c.get("userId")
  );
  return ok(c, { message: "Marked as read." });
});

export { notifications as notificationsRouter };
