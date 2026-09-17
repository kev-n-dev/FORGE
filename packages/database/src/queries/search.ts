import { dbAll, dbFirst, offset, type DB } from "../utils";
import type { ProfessionalProfileRow } from "./profiles";

export interface ProfessionalSearchParams {
  query?: string;
  categoryId?: string;
  country?: string;
  region?: string;
  city?: string;
  minLevel?: number;
  minRating?: number;
  minReviews?: number;
  identityVerified?: boolean;
  businessVerified?: boolean;
  availability?: string[];
  mentorship?: boolean;
  sortBy?: string;
  page: number;
  pageSize: number;
}

export interface ProfessionalSearchRow extends ProfessionalProfileRow {
  identity_verified: number;
  business_verified: number;
  total_count: number;
}

/**
 * Full-text and filter search over professional profiles.
 * D1 uses SQLite FTS5 for text matching.
 */
export async function searchProfessionals(
  db: DB,
  params: ProfessionalSearchParams
): Promise<{ results: ProfessionalSearchRow[]; total: number }> {
  const conditions: string[] = ["pp.is_public = 1"];
  const bindings: unknown[] = [];

  if (params.country) {
    conditions.push("pp.location_country_code = ?");
    bindings.push(params.country);
  }
  if (params.region) {
    conditions.push("pp.location_region LIKE ?");
    bindings.push(`%${params.region}%`);
  }
  if (params.city) {
    conditions.push("pp.location_city LIKE ?");
    bindings.push(`%${params.city}%`);
  }
  if (params.minLevel) {
    conditions.push("pp.reputation_level >= ?");
    bindings.push(params.minLevel);
  }
  if (params.minRating !== undefined) {
    conditions.push("pp.average_rating >= ?");
    bindings.push(params.minRating);
  }
  if (params.minReviews !== undefined) {
    conditions.push("pp.review_count >= ?");
    bindings.push(params.minReviews);
  }
  if (params.mentorship) {
    conditions.push("pp.available_for_mentorship = 1");
  }
  if (params.availability && params.availability.length > 0) {
    const placeholders = params.availability.map(() => "?").join(",");
    conditions.push(`pp.availability IN (${placeholders})`);
    bindings.push(...params.availability);
  }

  // Category filter via join
  if (params.categoryId) {
    conditions.push(
      "EXISTS (SELECT 1 FROM professional_categories pc WHERE pc.professional_id = pp.id AND pc.category_id = ?)"
    );
    bindings.push(params.categoryId);
  }

  // Identity/business verified
  if (params.identityVerified) {
    conditions.push(
      "EXISTS (SELECT 1 FROM verifications v WHERE v.professional_id = pp.id AND v.type = 'identity' AND v.status = 'verified')"
    );
  }
  if (params.businessVerified) {
    conditions.push(
      "EXISTS (SELECT 1 FROM verifications v WHERE v.professional_id = pp.id AND v.type = 'business' AND v.status = 'verified')"
    );
  }

  // Text search via FTS
  if (params.query) {
    conditions.push(
      `pp.id IN (SELECT professional_id FROM professional_search_fts WHERE professional_search_fts MATCH ?)`
    );
    bindings.push(`"${params.query.replace(/"/g, '""')}"`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const orderBy = (() => {
    switch (params.sortBy) {
      case "rating":
        return "pp.average_rating DESC NULLS LAST, pp.review_count DESC";
      case "reviews":
        return "pp.review_count DESC";
      case "verified_jobs":
        return "pp.verified_job_count DESC";
      case "level":
        return "pp.reputation_level DESC";
      case "newest":
        return "pp.member_since DESC";
      case "recently_active":
        return "pp.last_active_at DESC NULLS LAST";
      default:
        return "pp.reputation_level DESC, pp.average_rating DESC NULLS LAST";
    }
  })();

  const countRow = await dbFirst<{ total: number }>(
    db,
    `SELECT COUNT(*) as total
     FROM professional_profiles pp
     LEFT JOIN verifications iv ON iv.professional_id = pp.id AND iv.type = 'identity' AND iv.status = 'verified'
     LEFT JOIN verifications bv ON bv.professional_id = pp.id AND bv.type = 'business' AND bv.status = 'verified'
     ${where}`,
    ...bindings
  );

  const results = await dbAll<ProfessionalSearchRow>(
    db,
    `SELECT pp.*,
            CASE WHEN iv.id IS NOT NULL THEN 1 ELSE 0 END as identity_verified,
            CASE WHEN bv.id IS NOT NULL THEN 1 ELSE 0 END as business_verified
     FROM professional_profiles pp
     LEFT JOIN verifications iv ON iv.professional_id = pp.id AND iv.type = 'identity' AND iv.status = 'verified'
     LEFT JOIN verifications bv ON bv.professional_id = pp.id AND bv.type = 'business' AND bv.status = 'verified'
     ${where}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    ...bindings,
    params.pageSize,
    offset(params.page, params.pageSize)
  );

  return { results, total: countRow?.total ?? 0 };
}
