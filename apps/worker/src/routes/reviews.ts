/**
 * Review routes
 * GET  /api/reviews/:professionalId        — list reviews for a professional
 * POST /api/reviews                        — create review (customer)
 * PUT  /api/reviews/:id                    — edit review (within window)
 * POST /api/reviews/:id/response           — professional response
 * POST /api/reviews/:id/report             — report a review
 * GET  /api/reviews/:professionalId/summary — rating summary
 */

import { Hono } from "hono";
import {
  createReview,
  getReviewsByProfessional,
  getReviewsCountByProfessional,
  updateReview,
  createReviewResponse,
  getReviewResponse,
  getReviewById,
  findProfessionalBySlug,
  createReport,
  findProfessionalByUserId,
} from "@forge/database";
import {
  CreateReviewSchema,
  UpdateReviewSchema,
  CreateReviewResponseSchema,
  CreateReportSchema,
} from "@forge/validation";
import { verifyTurnstile, assertOwnerOrAdmin, NotFoundError } from "@forge/auth";
import { UserRole } from "@forge/types";
import { recordReputationEvent, recalculateReputationLevel } from "@forge/database";
import type { Env, HonoVariables } from "../types";
import { ok, err, created, paginated, buildPaginationMeta } from "../utils/response";
import { validate } from "../utils/validate";
import { requireAuth } from "../middleware/auth";
import { reviewRateLimit, reportRateLimit, apiRateLimit } from "../middleware/ratelimit";

const reviews = new Hono<{ Bindings: Env; Variables: HonoVariables }>();

// ---------------------------------------------------------------------------
// GET /api/reviews/professional/:slug
// ---------------------------------------------------------------------------
reviews.get("/professional/:slug", async (c) => {
  const profile = await findProfessionalBySlug(c.env.DB, c.req.param("slug"));
  if (!profile) throw new NotFoundError("Profile");

  const page = Number(c.req.query("page") ?? "1");
  const pageSize = Math.min(Number(c.req.query("pageSize") ?? "20"), 50);

  const [items, total] = await Promise.all([
    getReviewsByProfessional(c.env.DB, profile.id, page, pageSize),
    getReviewsCountByProfessional(c.env.DB, profile.id),
  ]);

  // Attach responses
  const withResponses = await Promise.all(
    items.map(async (r) => ({
      ...r,
      response: await getReviewResponse(c.env.DB, r.id),
    }))
  );

  return paginated(c, withResponses, buildPaginationMeta(total, page, pageSize));
});

// ---------------------------------------------------------------------------
// GET /api/reviews/professional/:slug/summary
// ---------------------------------------------------------------------------
reviews.get("/professional/:slug/summary", async (c) => {
  const profile = await findProfessionalBySlug(c.env.DB, c.req.param("slug"));
  if (!profile) throw new NotFoundError("Profile");

  return ok(c, {
    professionalId: profile.id,
    averageRating: profile.average_rating,
    totalCount: profile.review_count,
    wouldHireAgainPercent: profile.would_hire_again_percent,
  });
});

// ---------------------------------------------------------------------------
// POST /api/reviews — create
// ---------------------------------------------------------------------------
reviews.post("/", requireAuth, reviewRateLimit, async (c) => {
  const role = c.get("userRole") as UserRole;
  if (role !== UserRole.Customer) {
    return err(c, "FORBIDDEN", "Only customers can leave reviews.", 403);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = validate(CreateReviewSchema, body);
  if (!parsed.success) return err(c, "VALIDATION_ERROR", "Validation failed", 422, parsed.errors);

  const ip = c.req.header("CF-Connecting-IP");
  const ts = await verifyTurnstile(parsed.data.turnstileToken, c.env.TURNSTILE_SECRET, ip);
  if (!ts.success) return err(c, "CAPTCHA_FAILED", "CAPTCHA verification failed.", 400);

  // Must have a professionalId to attach the review to
  const professionalId = c.req.query("professionalId");
  if (!professionalId) return err(c, "MISSING_FIELD", "professionalId query param required.", 400);

  const review = await createReview(c.env.DB, {
    professionalId,
    customerId: c.get("userId"),
    jobId: parsed.data.jobId,
    productId: parsed.data.productId,
    orderId: parsed.data.orderId,
    rating: parsed.data.rating,
    body: parsed.data.body,
    wouldHireAgain: parsed.data.wouldHireAgain,
  });

  // Record reputation event and recalculate level asynchronously
  await recordReputationEvent(c.env.DB, professionalId, {
    eventType: "review_received",
    sourceType: "review",
    sourceId: review.id,
    value: parsed.data.rating,
    description: `Received a ${parsed.data.rating}-star review`,
  });
  await recalculateReputationLevel(c.env.DB, professionalId);

  return created(c, review);
});

// ---------------------------------------------------------------------------
// PUT /api/reviews/:id — edit within window (customer only)
// ---------------------------------------------------------------------------
reviews.put("/:id", requireAuth, apiRateLimit, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = validate(UpdateReviewSchema, body);
  if (!parsed.success) return err(c, "VALIDATION_ERROR", "Validation failed", 422, parsed.errors);

  const updated = await updateReview(
    c.env.DB,
    c.req.param("id"),
    c.get("userId"),
    parsed.data.body,
    parsed.data.wouldHireAgain
  );

  if (!updated) {
    return err(
      c,
      "EDIT_WINDOW_CLOSED",
      "This review can no longer be edited. The edit window has closed.",
      409
    );
  }

  return ok(c, { message: "Review updated." });
});

// ---------------------------------------------------------------------------
// POST /api/reviews/:id/response — professional response
// ---------------------------------------------------------------------------
reviews.post("/:id/response", requireAuth, apiRateLimit, async (c) => {
  const role = c.get("userRole") as UserRole;
  if (role !== UserRole.Professional) {
    return err(c, "FORBIDDEN", "Only professionals can respond to reviews.", 403);
  }

  const review = await getReviewById(c.env.DB, c.req.param("id"));
  if (!review) throw new NotFoundError("Review");

  // Verify the professional owns the profile this review is for
  const profile = await findProfessionalByUserId(c.env.DB, c.get("userId"));
  if (!profile || profile.id !== review.professional_id) {
    return err(c, "FORBIDDEN", "You can only respond to reviews on your own profile.", 403);
  }

  if (review.status === "removed") {
    return err(c, "REVIEW_REMOVED", "Cannot respond to a removed review.", 409);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = validate(CreateReviewResponseSchema, body);
  if (!parsed.success) return err(c, "VALIDATION_ERROR", "Validation failed", 422, parsed.errors);

  const response = await createReviewResponse(
    c.env.DB,
    review.id,
    profile.id,
    parsed.data.body
  );

  return created(c, response);
});

// ---------------------------------------------------------------------------
// POST /api/reviews/:id/report
// ---------------------------------------------------------------------------
reviews.post("/:id/report", requireAuth, reportRateLimit, async (c) => {
  const review = await getReviewById(c.env.DB, c.req.param("id"));
  if (!review) throw new NotFoundError("Review");

  const body = await c.req.json().catch(() => null);
  const parsed = validate(CreateReportSchema, body);
  if (!parsed.success) return err(c, "VALIDATION_ERROR", "Validation failed", 422, parsed.errors);

  const ip = c.req.header("CF-Connecting-IP");
  const ts = await verifyTurnstile(parsed.data.turnstileToken, c.env.TURNSTILE_SECRET, ip);
  if (!ts.success) return err(c, "CAPTCHA_FAILED", "CAPTCHA verification failed.", 400);

  await createReport(c.env.DB, {
    reporterId: c.get("userId"),
    targetType: "review",
    targetId: review.id,
    reason: parsed.data.reason,
    description: parsed.data.description,
  });

  return ok(c, { message: "Report submitted. Our team will review it." });
});

export { reviews as reviewsRouter };
