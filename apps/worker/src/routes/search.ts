/**
 * Search routes
 * GET /api/search/professionals
 * GET /api/search/products
 * GET /api/search/categories
 */

import { Hono } from "hono";
import { searchProfessionals, getAllActiveCategories } from "@guild/database";
import { ProfessionalSearchSchema } from "@guild/validation";
import { ReputationLevel } from "@guild/types";
import type { Env, HonoVariables } from "../types";
import { ok, paginated, buildPaginationMeta } from "../utils/response";
import { validate } from "../utils/validate";
import { searchRateLimit } from "../middleware/ratelimit";

const search = new Hono<{ Bindings: Env; Variables: HonoVariables }>();

search.use("*", searchRateLimit);

// ---------------------------------------------------------------------------
// GET /api/search/professionals
// ---------------------------------------------------------------------------
search.get("/professionals", async (c) => {
  const query = Object.fromEntries(new URL(c.req.url).searchParams);
  const parsed = validate(ProfessionalSearchSchema, query);

  if (!parsed.success) {
    // On search validation failure, return empty results not an error
    return ok(c, { items: [], pagination: buildPaginationMeta(0, 1, 20) });
  }

  const { q, categoryId, country, region, city, minLevel, minRating, minReviews,
    identityVerified, businessVerified, mentorship, sortBy, page, pageSize } = parsed.data;

  const { results, total } = await searchProfessionals(c.env.DB, {
    query: q,
    categoryId,
    country,
    region,
    city,
    minLevel: minLevel as ReputationLevel | undefined,
    minRating,
    minReviews,
    identityVerified,
    businessVerified,
    mentorship,
    sortBy,
    page: page ?? 1,
    pageSize: pageSize ?? 20,
  });

  // Map results to public search cards
  const cards = results.map((r) => ({
    id: r.id,
    displayName: r.display_name,
    businessName: r.business_name,
    profileSlug: r.profile_slug,
    avatarUrl: r.avatar_url,
    categoryNames: [] as string[], // joined separately if needed
    location: [r.location_city, r.location_region, r.location_country]
      .filter(Boolean)
      .join(", ") || null,
    reputationLevel: r.reputation_level,
    reputationLevelName: r.reputation_level_name,
    averageRating: r.average_rating,
    reviewCount: r.review_count,
    verifiedJobCount: r.verified_job_count,
    wouldHireAgainPercent: r.would_hire_again_percent,
    identityVerified: r.identity_verified === 1,
    businessVerified: r.business_verified === 1,
    availability: r.availability,
    isSponsored: false, // Advertising not enabled in Phase 1
  }));

  return paginated(c, cards, buildPaginationMeta(total, page ?? 1, pageSize ?? 20));
});

// ---------------------------------------------------------------------------
// GET /api/search/categories
// ---------------------------------------------------------------------------
search.get("/categories", async (c) => {
  const categories = await getAllActiveCategories(c.env.DB);
  return ok(c, categories);
});

export { search as searchRouter };
