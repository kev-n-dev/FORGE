/**
 * Admin routes — all require admin role
 * GET  /api/admin/users
 * GET  /api/admin/users/:id
 * POST /api/admin/users/:id/status
 * GET  /api/admin/reports
 * POST /api/admin/reports/:id/status
 * POST /api/admin/reviews/:id/remove
 * GET  /api/admin/audit-logs
 * GET  /api/admin/verifications
 * POST /api/admin/verifications/:id/review
 * GET  /api/admin/feature-flags
 * PUT  /api/admin/feature-flags/:key
 */

import { Hono } from "hono";
import {
  findUserById,
  updateUserStatus,
  adminRemoveReview,
  getReviewById,
  updateReportStatus,
  getOpenReports,
  getAuditLogs,
  createAuditLog,
  dbAll,
  dbFirst,
  dbRun,
  now,
} from "@guild/database";
import {
  AdminUpdateUserStatusSchema,
  AdminRemoveReviewSchema,
  AdminUpdateReportStatusSchema,
  AdminReviewVerificationSchema,
} from "@guild/validation";
import { NotFoundError } from "@guild/auth";
import type { Env, HonoVariables } from "../types";
import { ok, err, paginated, buildPaginationMeta } from "../utils/response";
import { validate } from "../utils/validate";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/rbac";
import { apiRateLimit } from "../middleware/ratelimit";

const admin = new Hono<{ Bindings: Env; Variables: HonoVariables }>();

// All admin routes require authentication + admin role
admin.use("*", requireAuth, requireAdmin);

// ---------------------------------------------------------------------------
// GET /api/admin/users?page=1&q=
// ---------------------------------------------------------------------------
admin.get("/users", async (c) => {
  const page = Number(c.req.query("page") ?? "1");
  const pageSize = 50;
  const q = c.req.query("q") ?? "";

  const where = q ? "WHERE email LIKE ? OR id = ?" : "";
  const bindings = q ? [`%${q}%`, q] : [];

  const countRow = await dbFirst<{ cnt: number }>(
    c.env.DB,
    `SELECT COUNT(*) as cnt FROM users ${where}`,
    ...bindings
  );
  const users = await dbAll(
    c.env.DB,
    `SELECT id, email, role, status, email_verified, created_at, last_login_at
     FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    ...bindings,
    pageSize,
    (page - 1) * pageSize
  );

  return paginated(c, users, buildPaginationMeta(countRow?.cnt ?? 0, page, pageSize));
});

// ---------------------------------------------------------------------------
// GET /api/admin/users/:id
// ---------------------------------------------------------------------------
admin.get("/users/:id", async (c) => {
  const user = await findUserById(c.env.DB, c.req.param("id"));
  if (!user) throw new NotFoundError("User");
  // Omit password_hash from admin view
  const { password_hash: _, mfa_secret: __, ...safe } = user;
  return ok(c, safe);
});

// ---------------------------------------------------------------------------
// POST /api/admin/users/:id/status
// ---------------------------------------------------------------------------
admin.post("/users/:id/status", apiRateLimit, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = validate(AdminUpdateUserStatusSchema, { ...body, userId: c.req.param("id") });
  if (!parsed.success) return err(c, "VALIDATION_ERROR", "Validation failed", 422, parsed.errors);

  const user = await findUserById(c.env.DB, parsed.data.userId);
  if (!user) throw new NotFoundError("User");

  const previousStatus = user.status;
  await updateUserStatus(c.env.DB, parsed.data.userId, parsed.data.status);

  await createAuditLog(c.env.DB, {
    adminId: c.get("userId"),
    action: "update_user_status",
    targetType: "user",
    targetId: parsed.data.userId,
    reason: parsed.data.reason,
    previousState: { status: previousStatus },
    newState: { status: parsed.data.status },
  });

  return ok(c, { message: `User status updated to ${parsed.data.status}.` });
});

// ---------------------------------------------------------------------------
// GET /api/admin/reports
// ---------------------------------------------------------------------------
admin.get("/reports", async (c) => {
  const page = Number(c.req.query("page") ?? "1");
  const reports = await getOpenReports(c.env.DB, page, 50);
  return ok(c, reports);
});

// ---------------------------------------------------------------------------
// POST /api/admin/reports/:id/status
// ---------------------------------------------------------------------------
admin.post("/reports/:id/status", apiRateLimit, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = validate(AdminUpdateReportStatusSchema, {
    ...body,
    reportId: c.req.param("id"),
  });
  if (!parsed.success) return err(c, "VALIDATION_ERROR", "Validation failed", 422, parsed.errors);

  await updateReportStatus(
    c.env.DB,
    parsed.data.reportId,
    c.get("userId"),
    parsed.data.status,
    parsed.data.adminNotes,
    parsed.data.resolution
  );

  await createAuditLog(c.env.DB, {
    adminId: c.get("userId"),
    action: "update_report_status",
    targetType: "report",
    targetId: parsed.data.reportId,
    reason: parsed.data.adminNotes ?? "Status update",
    newState: { status: parsed.data.status },
  });

  return ok(c, { message: "Report status updated." });
});

// ---------------------------------------------------------------------------
// POST /api/admin/reviews/:id/remove
// Professionals CANNOT call this. Admin only — creates audit log.
// ---------------------------------------------------------------------------
admin.post("/reviews/:id/remove", apiRateLimit, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = validate(AdminRemoveReviewSchema, { ...body, reviewId: c.req.param("id") });
  if (!parsed.success) return err(c, "VALIDATION_ERROR", "Validation failed", 422, parsed.errors);

  const review = await getReviewById(c.env.DB, parsed.data.reviewId);
  if (!review) throw new NotFoundError("Review");

  // adminRemoveReview internally writes the audit log
  await adminRemoveReview(c.env.DB, parsed.data.reviewId, c.get("userId"), parsed.data.reason);

  return ok(c, { message: "Review removed. Audit record created." });
});

// ---------------------------------------------------------------------------
// GET /api/admin/audit-logs
// ---------------------------------------------------------------------------
admin.get("/audit-logs", async (c) => {
  const page = Number(c.req.query("page") ?? "1");
  const targetType = c.req.query("targetType");
  const targetId = c.req.query("targetId");
  const adminId = c.req.query("adminId");

  const logs = await getAuditLogs(c.env.DB, {
    targetType,
    targetId,
    adminId,
    page,
    pageSize: 100,
  });

  return ok(c, logs);
});

// ---------------------------------------------------------------------------
// GET /api/admin/verifications
// ---------------------------------------------------------------------------
admin.get("/verifications", async (c) => {
  const status = c.req.query("status") ?? "pending";
  const verifications = await dbAll(
    c.env.DB,
    `SELECT id, professional_id, type, status, submitted_at, rejection_reason, notes
     FROM verifications WHERE status = ? ORDER BY submitted_at ASC LIMIT 100`,
    status
  );
  // Note: document_keys are NOT returned — admin must use a separate secure endpoint
  return ok(c, verifications);
});

// ---------------------------------------------------------------------------
// POST /api/admin/verifications/:id/review
// ---------------------------------------------------------------------------
admin.post("/verifications/:id/review", apiRateLimit, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = validate(AdminReviewVerificationSchema, {
    ...body,
    verificationId: c.req.param("id"),
  });
  if (!parsed.success) return err(c, "VALIDATION_ERROR", "Validation failed", 422, parsed.errors);

  const record = await dbFirst<{ id: string; professional_id: string; status: string }>(
    c.env.DB,
    "SELECT id, professional_id, status FROM verifications WHERE id = ?",
    parsed.data.verificationId
  );
  if (!record) throw new NotFoundError("Verification record");

  await dbRun(
    c.env.DB,
    `UPDATE verifications SET
       status = ?,
       reviewed_at = ?,
       reviewed_by_admin_id = ?,
       expires_at = ?,
       rejection_reason = ?,
       notes = ?,
       updated_at = ?
     WHERE id = ?`,
    parsed.data.status,
    now(),
    c.get("userId"),
    parsed.data.expiresAt ?? null,
    parsed.data.rejectionReason ?? null,
    parsed.data.notes ?? null,
    now(),
    parsed.data.verificationId
  );

  await createAuditLog(c.env.DB, {
    adminId: c.get("userId"),
    action: "review_verification",
    targetType: "verification",
    targetId: parsed.data.verificationId,
    reason: parsed.data.rejectionReason ?? `Verification ${parsed.data.status}`,
    previousState: { status: record.status },
    newState: { status: parsed.data.status },
  });

  return ok(c, { message: `Verification ${parsed.data.status}.` });
});

// ---------------------------------------------------------------------------
// GET /api/admin/feature-flags
// ---------------------------------------------------------------------------
admin.get("/feature-flags", async (c) => {
  const flags = await dbAll(c.env.DB, "SELECT key, enabled, description FROM feature_flags ORDER BY key");
  return ok(c, flags);
});

// ---------------------------------------------------------------------------
// PUT /api/admin/feature-flags/:key
// ---------------------------------------------------------------------------
admin.put("/feature-flags/:key", apiRateLimit, async (c) => {
  const key = c.req.param("key");
  const body = await c.req.json().catch(() => null) as { enabled?: boolean } | null;

  if (typeof body?.enabled !== "boolean") {
    return err(c, "VALIDATION_ERROR", "enabled (boolean) is required.", 422);
  }

  await dbRun(
    c.env.DB,
    "UPDATE feature_flags SET enabled = ?, updated_at = ? WHERE key = ?",
    body.enabled ? 1 : 0,
    now(),
    key
  );

  await createAuditLog(c.env.DB, {
    adminId: c.get("userId"),
    action: "update_feature_flag",
    targetType: "feature_flag",
    targetId: key,
    reason: `Feature flag ${key} set to ${body.enabled}`,
    newState: { enabled: body.enabled },
  });

  return ok(c, { key, enabled: body.enabled });
});

export { admin as adminRouter };
