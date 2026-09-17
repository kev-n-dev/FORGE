import { dbAll, dbFirst, dbRun, newId, now, offset, type DB } from "../utils";

export interface ReviewRow {
  id: string;
  professional_id: string;
  customer_id: string;
  job_id: string | null;
  product_id: string | null;
  order_id: string | null;
  rating: number;
  body: string;
  would_hire_again: number | null;
  status: string;
  created_at: string;
  edit_locked_at: string | null;
  updated_at: string;
}

export interface ReviewResponseRow {
  id: string;
  review_id: string;
  professional_id: string;
  body: string;
  created_at: string;
  updated_at: string;
}

const REVIEW_EDIT_WINDOW_HOURS = 48;

export async function createReview(
  db: DB,
  params: {
    professionalId: string;
    customerId: string;
    jobId?: string;
    productId?: string;
    orderId?: string;
    rating: number;
    body: string;
    wouldHireAgain?: boolean;
  }
): Promise<ReviewRow> {
  const id = newId();
  const ts = now();
  const lockAt = new Date(Date.now() + REVIEW_EDIT_WINDOW_HOURS * 3600 * 1000).toISOString();

  await dbRun(
    db,
    `INSERT INTO reviews
       (id, professional_id, customer_id, job_id, product_id, order_id,
        rating, body, would_hire_again, status, edit_locked_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
    id,
    params.professionalId,
    params.customerId,
    params.jobId ?? null,
    params.productId ?? null,
    params.orderId ?? null,
    params.rating,
    params.body,
    params.wouldHireAgain !== undefined ? (params.wouldHireAgain ? 1 : 0) : null,
    lockAt,
    ts,
    ts
  );

  // Trigger reputation update via background or synchronous calculation
  await recalculateProfessionalRating(db, params.professionalId);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return (await getReviewById(db, id))!;
}

export async function getReviewById(db: DB, id: string): Promise<ReviewRow | null> {
  return dbFirst<ReviewRow>(db, "SELECT * FROM reviews WHERE id = ?", id);
}

export async function getReviewsByProfessional(
  db: DB,
  professionalId: string,
  page = 1,
  pageSize = 20
): Promise<ReviewRow[]> {
  return dbAll<ReviewRow>(
    db,
    `SELECT * FROM reviews
     WHERE professional_id = ? AND status IN ('active', 'locked')
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    professionalId,
    pageSize,
    offset(page, pageSize)
  );
}

export async function getReviewsCountByProfessional(
  db: DB,
  professionalId: string
): Promise<number> {
  const row = await dbFirst<{ cnt: number }>(
    db,
    "SELECT COUNT(*) as cnt FROM reviews WHERE professional_id = ? AND status IN ('active','locked')",
    professionalId
  );
  return row?.cnt ?? 0;
}

/** Only within edit window AND by the original customer. Professionals cannot edit reviews. */
export async function updateReview(
  db: DB,
  reviewId: string,
  customerId: string,
  body: string,
  wouldHireAgain?: boolean
): Promise<boolean> {
  const review = await getReviewById(db, reviewId);
  if (!review || review.customer_id !== customerId) return false;
  if (review.edit_locked_at && new Date(review.edit_locked_at) < new Date()) return false;
  if (review.status === "locked" || review.status === "removed") return false;

  await dbRun(
    db,
    "UPDATE reviews SET body = ?, would_hire_again = ?, updated_at = ? WHERE id = ?",
    body,
    wouldHireAgain !== undefined ? (wouldHireAgain ? 1 : 0) : review.would_hire_again,
    now(),
    reviewId
  );
  return true;
}

/**
 * Admin-only removal — creates an audit log entry.
 * Professionals CANNOT call this function.
 */
export async function adminRemoveReview(
  db: DB,
  reviewId: string,
  adminId: string,
  reason: string
): Promise<void> {
  const review = await getReviewById(db, reviewId);
  if (!review) return;

  await dbRun(db, "UPDATE reviews SET status = 'removed', updated_at = ? WHERE id = ?", now(), reviewId);

  // Audit log
  await dbRun(
    db,
    `INSERT INTO audit_logs (id, admin_id, action, target_type, target_id, reason, previous_state, created_at)
     VALUES (?, ?, 'remove_review', 'review', ?, ?, ?, ?)`,
    newId(),
    adminId,
    reviewId,
    reason,
    JSON.stringify({ status: review.status, body: review.body }),
    now()
  );

  await recalculateProfessionalRating(db, review.professional_id);
}

export async function createReviewResponse(
  db: DB,
  reviewId: string,
  professionalId: string,
  body: string
): Promise<ReviewResponseRow> {
  // Professionals can respond but CANNOT have more than one response per review
  const existing = await dbFirst<ReviewResponseRow>(
    db,
    "SELECT * FROM review_responses WHERE review_id = ?",
    reviewId
  );
  if (existing) {
    await dbRun(
      db,
      "UPDATE review_responses SET body = ?, updated_at = ? WHERE id = ?",
      body,
      now(),
      existing.id
    );
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return (await dbFirst<ReviewResponseRow>(db, "SELECT * FROM review_responses WHERE id = ?", existing.id))!;
  }

  const id = newId();
  const ts = now();
  await dbRun(
    db,
    `INSERT INTO review_responses (id, review_id, professional_id, body, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    id,
    reviewId,
    professionalId,
    body,
    ts,
    ts
  );
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return (await dbFirst<ReviewResponseRow>(db, "SELECT * FROM review_responses WHERE id = ?", id))!;
}

export async function getReviewResponse(
  db: DB,
  reviewId: string
): Promise<ReviewResponseRow | null> {
  return dbFirst<ReviewResponseRow>(
    db,
    "SELECT * FROM review_responses WHERE review_id = ?",
    reviewId
  );
}

/** Recalculate and cache average rating + would-hire-again on the profile. */
async function recalculateProfessionalRating(db: DB, professionalId: string): Promise<void> {
  const stats = await dbFirst<{
    avg_rating: number | null;
    total: number;
    hire_again_yes: number;
    hire_again_total: number;
  }>(
    db,
    `SELECT
       AVG(CAST(rating AS REAL)) as avg_rating,
       COUNT(*) as total,
       SUM(CASE WHEN would_hire_again = 1 THEN 1 ELSE 0 END) as hire_again_yes,
       SUM(CASE WHEN would_hire_again IS NOT NULL THEN 1 ELSE 0 END) as hire_again_total
     FROM reviews
     WHERE professional_id = ? AND status IN ('active','locked')`,
    professionalId
  );

  if (!stats) return;

  const wouldHireAgainPct =
    stats.hire_again_total > 0
      ? Math.round((stats.hire_again_yes / stats.hire_again_total) * 100)
      : null;

  await dbRun(
    db,
    `UPDATE professional_profiles SET
       average_rating = ?,
       review_count = ?,
       would_hire_again_percent = ?,
       updated_at = ?
     WHERE id = ?`,
    stats.avg_rating !== null ? Math.round(stats.avg_rating * 10) / 10 : null,
    stats.total,
    wouldHireAgainPct,
    now(),
    professionalId
  );
}
