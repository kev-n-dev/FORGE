/**
 * Professional profile routes
 *
 * IMPORTANT: /me routes MUST be registered before /:slug routes in Hono
 * to prevent "me" being matched as a slug parameter.
 *
 * GET  /api/profiles/me                  — own profile (authenticated)
 * PUT  /api/profiles/me                  — update own profile
 * PUT  /api/profiles/me/avatar/upload    — upload avatar directly
 * POST /api/profiles/me/skills           — add skill
 * DELETE /api/profiles/me/skills/:id     — remove skill
 * POST /api/profiles/me/services         — add service
 * GET  /api/profiles/categories          — all active categories
 * GET  /api/profiles/:slug               — public profile
 * GET  /api/profiles/:slug/skills        — skills for a profile
 * GET  /api/profiles/:slug/services      — services for a profile
 * GET  /api/profiles/:slug/trust-card    — trust card evidence
 * GET  /api/profiles/:slug/projects      — portfolio projects
 */

import { Hono } from "hono";
import {
  findProfessionalBySlug,
  findProfessionalByUserId,
  updateProfessionalProfile,
  getProfessionalSkills,
  addProfessionalSkill,
  removeProfessionalSkill,
  updateProfessionalAvatar,
  getAllActiveCategories,
  getProjectsByProfessional,
  getProjectMedia,
  dbFirst,
  dbAll,
  dbRun,
  newId,
  now,
} from "@forge/database";
import {
  UpdateProfessionalProfileSchema,
  AddSkillSchema,
  AddServiceSchema,
} from "@forge/validation";
import { isAllowedMimeType, isAllowedSize, R2_KEY_PREFIXES, LEVEL_NAMES, LEVEL_DESCRIPTIONS } from "@forge/config";
import { NotFoundError } from "@forge/auth";
import { ReputationLevel } from "@forge/types";
import type { ProfessionalProfileRow } from "@forge/database";
import type { Env, HonoVariables } from "../types";
import { ok, err, created } from "../utils/response";
import { validate } from "../utils/validate";
import { requireAuth, optionalAuth } from "../middleware/auth";
import { apiRateLimit } from "../middleware/ratelimit";

const profiles = new Hono<{ Bindings: Env; Variables: HonoVariables }>();

// ---------------------------------------------------------------------------
// /me routes FIRST — must come before /:slug to avoid Hono matching "me" as slug
// ---------------------------------------------------------------------------

profiles.get("/me", requireAuth, async (c) => {
  const row = await findProfessionalByUserId(c.env.DB, c.get("userId"));
  if (!row) throw new NotFoundError("Professional profile");
  return ok(c, await buildProfileResponse(c.env.DB, row));
});

profiles.put("/me", requireAuth, apiRateLimit, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = validate(UpdateProfessionalProfileSchema, body);
  if (!parsed.success) return err(c, "VALIDATION_ERROR", "Validation failed", 422, parsed.errors);

  const profile = await findProfessionalByUserId(c.env.DB, c.get("userId"));
  if (!profile) throw new NotFoundError("Professional profile");

  await updateProfessionalProfile(c.env.DB, profile.id, {
    displayName: parsed.data.displayName,
    businessName: parsed.data.businessName,
    tagline: parsed.data.tagline,
    bio: parsed.data.bio,
    locationCountry: parsed.data.locationCountry,
    locationRegion: parsed.data.locationRegion,
    locationCity: parsed.data.locationCity,
    serviceAreaDescription: parsed.data.serviceAreaDescription,
    availability: parsed.data.availability,
    availableForMentorship: parsed.data.availableForMentorship,
    yearsExperience: parsed.data.yearsExperience,
    websiteUrl: parsed.data.websiteUrl,
    isPublic: parsed.data.isPublic,
  });

  // Update FTS index
  await updateProfileFts(c.env.DB, profile.id);

  const updated = await findProfessionalByUserId(c.env.DB, c.get("userId"));
  return ok(c, updated);
});

profiles.put("/me/avatar/upload", requireAuth, async (c) => {
  const profile = await findProfessionalByUserId(c.env.DB, c.get("userId"));
  if (!profile) throw new NotFoundError("Professional profile");

  const contentType = c.req.header("Content-Type") ?? "";
  if (!isAllowedMimeType("avatar", contentType)) {
    return err(c, "INVALID_MIME", "File type not allowed.", 400);
  }

  const body = await c.req.arrayBuffer();
  if (!isAllowedSize("avatar", body.byteLength)) {
    return err(c, "FILE_TOO_LARGE", "File exceeds maximum size.", 400);
  }

  const ext = contentType.split("/")[1] ?? "jpg";
  const objectKey = `${R2_KEY_PREFIXES.avatar}${profile.id}/${crypto.randomUUID()}.${ext}`;

  await c.env.MEDIA_BUCKET.put(objectKey, body, { httpMetadata: { contentType } });

  const publicUrl = `${c.env.MEDIA_BASE_URL}/${objectKey}`;
  await updateProfessionalAvatar(c.env.DB, profile.id, publicUrl);

  return ok(c, { avatarUrl: publicUrl });
});

profiles.post("/me/skills", requireAuth, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = validate(AddSkillSchema, body);
  if (!parsed.success) return err(c, "VALIDATION_ERROR", "Validation failed", 422, parsed.errors);

  const profile = await findProfessionalByUserId(c.env.DB, c.get("userId"));
  if (!profile) throw new NotFoundError("Professional profile");

  const id = await addProfessionalSkill(c.env.DB, profile.id, {
    name: parsed.data.name,
    yearsExperience: parsed.data.yearsExperience,
    featured: parsed.data.featured,
  });

  // Update FTS
  await updateProfileFts(c.env.DB, profile.id);

  return created(c, { id, name: parsed.data.name });
});

profiles.delete("/me/skills/:skillId", requireAuth, async (c) => {
  const profile = await findProfessionalByUserId(c.env.DB, c.get("userId"));
  if (!profile) throw new NotFoundError("Professional profile");

  await removeProfessionalSkill(c.env.DB, c.req.param("skillId"), profile.id);
  await updateProfileFts(c.env.DB, profile.id);

  return ok(c, { message: "Skill removed." });
});

profiles.post("/me/services", requireAuth, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = validate(AddServiceSchema, body);
  if (!parsed.success) return err(c, "VALIDATION_ERROR", "Validation failed", 422, parsed.errors);

  const profile = await findProfessionalByUserId(c.env.DB, c.get("userId"));
  if (!profile) throw new NotFoundError("Professional profile");

  const id = newId();
  const ts = now();
  await dbRun(
    c.env.DB,
    `INSERT INTO services (id, professional_id, name, description, category_id, starting_price, currency, price_unit, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    id,
    profile.id,
    parsed.data.name,
    parsed.data.description ?? null,
    parsed.data.categoryId,
    parsed.data.startingPrice ?? null,
    parsed.data.currency ?? null,
    parsed.data.priceUnit ?? null,
    ts,
    ts
  );

  return created(c, { id, name: parsed.data.name });
});

// ---------------------------------------------------------------------------
// GET /api/profiles/categories — must be before /:slug
// ---------------------------------------------------------------------------
profiles.get("/categories", async (c) => {
  const cats = await getAllActiveCategories(c.env.DB);
  return ok(c, cats);
});

// ---------------------------------------------------------------------------
// /:slug routes AFTER all /me and named routes
// ---------------------------------------------------------------------------

profiles.get("/:slug", optionalAuth, async (c) => {
  const slug = c.req.param("slug");
  const row = await findProfessionalBySlug(c.env.DB, slug);
  if (!row) throw new NotFoundError("Profile");
  return ok(c, await buildProfileResponse(c.env.DB, row));
});

profiles.get("/:slug/skills", async (c) => {
  const profile = await findProfessionalBySlug(c.env.DB, c.req.param("slug"));
  if (!profile) throw new NotFoundError("Profile");
  return ok(c, await getProfessionalSkills(c.env.DB, profile.id));
});

profiles.get("/:slug/services", async (c) => {
  const profile = await findProfessionalBySlug(c.env.DB, c.req.param("slug"));
  if (!profile) throw new NotFoundError("Profile");

  const services = await dbAll(
    c.env.DB,
    `SELECT s.*, c.name as category_name
     FROM services s
     LEFT JOIN categories c ON c.id = s.category_id
     WHERE s.professional_id = ? AND s.is_active = 1
     ORDER BY s.created_at ASC`,
    profile.id
  );
  return ok(c, services);
});

profiles.get("/:slug/projects", async (c) => {
  const profile = await findProfessionalBySlug(c.env.DB, c.req.param("slug"));
  if (!profile) throw new NotFoundError("Profile");

  const page = Number(c.req.query("page") ?? "1");
  const pageSize = Math.min(Number(c.req.query("pageSize") ?? "12"), 50);

  const projects = await getProjectsByProfessional(c.env.DB, profile.id, page, pageSize);

  // Attach media for each project
  const withMedia = await Promise.all(
    projects.map(async (p) => ({
      ...p,
      media: await getProjectMedia(c.env.DB, p.id),
    }))
  );

  const countRow = await dbFirst<{ cnt: number }>(
    c.env.DB,
    "SELECT COUNT(*) as cnt FROM projects WHERE professional_id = ? AND status = 'published'",
    profile.id
  );

  return ok(c, { items: withMedia, total: countRow?.cnt ?? 0 });
});

profiles.get("/:slug/trust-card", async (c) => {
  const profile = await findProfessionalBySlug(c.env.DB, c.req.param("slug"));
  if (!profile) throw new NotFoundError("Profile");

  const verifications = await dbFirst<{ identity: number; business: number }>(
    c.env.DB,
    `SELECT
       MAX(CASE WHEN type='identity' AND status='verified' THEN 1 ELSE 0 END) as identity,
       MAX(CASE WHEN type='business' AND status='verified' THEN 1 ELSE 0 END) as business
     FROM verifications WHERE professional_id = ?`,
    profile.id
  );

  const yearsActive = Math.floor(
    (Date.now() - new Date(profile.member_since).getTime()) / (1000 * 60 * 60 * 24 * 365)
  );

  const portfolioCount = await dbFirst<{ cnt: number }>(
    c.env.DB,
    "SELECT COUNT(*) as cnt FROM projects WHERE professional_id = ? AND status = 'published'",
    profile.id
  );

  const recommendationCount = await dbFirst<{ cnt: number }>(
    c.env.DB,
    "SELECT COUNT(*) as cnt FROM recommendations WHERE professional_id = ? AND status = 'active'",
    profile.id
  ).catch(() => ({ cnt: 0 }));

  return ok(c, {
    identityVerified: verifications?.identity === 1,
    businessVerified: verifications?.business === 1,
    verifiedJobsCount: profile.verified_job_count,
    averageRating: profile.average_rating,
    reviewCount: profile.review_count,
    wouldHireAgainPercent: profile.would_hire_again_percent,
    recommendationCount: recommendationCount?.cnt ?? 0,
    yearsActive,
    portfolioProjectCount: portfolioCount?.cnt ?? 0,
    disclaimer:
      "This information reflects activity on FORGE. FORGE does not guarantee the quality of any professional's work.",
  });
});

// ---------------------------------------------------------------------------
// buildProfileResponse — maps a raw DB row to the full ProfessionalProfile shape
// ---------------------------------------------------------------------------

async function buildProfileResponse(db: D1Database, row: ProfessionalProfileRow) {
  const [skills, categories, verifications, socialLinks, portfolioCount] = await Promise.all([
    getProfessionalSkills(db, row.id),
    dbAll<{ category_id: string; name: string; slug: string; parent_id: string | null }>(
      db,
      `SELECT pc.category_id as id, c.name, c.slug, c.parent_id
       FROM professional_categories pc
       JOIN categories c ON c.id = pc.category_id
       WHERE pc.professional_id = ?
       ORDER BY c.sort_order ASC`,
      row.id
    ),
    dbAll<{ type: string; status: string; verified_at: string | null; expires_at: string | null }>(
      db,
      "SELECT type, status, reviewed_at as verified_at, expires_at FROM verifications WHERE professional_id = ? AND status = 'verified'",
      row.id
    ),
    dbAll<{ platform: string; url: string; label: string | null }>(
      db,
      "SELECT platform, url, label FROM social_links WHERE professional_id = ? ORDER BY sort_order ASC",
      row.id
    ),
    dbFirst<{ cnt: number }>(
      db,
      "SELECT COUNT(*) as cnt FROM projects WHERE professional_id = ? AND status = 'published'",
      row.id
    ),
  ]);

  const level = row.reputation_level as ReputationLevel;
  const nextLevel = level < 6 ? (level + 1) as ReputationLevel : null;

  const verificationBadgeLabels: Record<string, string> = {
    identity: "Identity Verified",
    business: "Business Verified",
    credential: "Credentials Verified",
    insurance: "Insurance Verified",
  };

  const verificationDescriptions: Record<string, string> = {
    identity: "Government-issued ID has been verified",
    business: "Business registration has been verified",
    credential: "Professional credentials have been verified",
    insurance: "Insurance documentation has been verified",
  };

  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    businessName: row.business_name,
    tagline: row.tagline,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    coverUrl: row.cover_url,

    location: row.location_country ? {
      country: row.location_country,
      countryCode: row.location_country_code ?? row.location_country,
      region: row.location_region,
      city: row.location_city,
      serviceAreaDescription: row.service_area_description,
    } : null,

    categories: (categories as Array<{ id?: string; category_id?: string; name: string; slug: string; parent_id: string | null }>).map((c) => ({
      id: c.id ?? c.category_id ?? "",
      name: c.name,
      slug: c.slug,
      parentId: c.parent_id,
    })),

    skills: skills.map((s) => ({
      id: s.id,
      name: s.name,
      yearsExperience: s.years_experience,
      featured: s.featured === 1,
    })),

    verifications: verifications.map((v) => ({
      type: v.type,
      label: verificationBadgeLabels[v.type] ?? v.type,
      description: verificationDescriptions[v.type] ?? "Verified",
      verifiedAt: v.verified_at ?? "",
      expiresAt: v.expires_at,
    })),

    socialLinks: socialLinks.map((s) => ({
      platform: s.platform,
      url: s.url,
      label: s.label,
    })),

    reputation: {
      level,
      levelName: LEVEL_NAMES[level] ?? "New",
      levelDescription: LEVEL_DESCRIPTIONS[level] ?? "",
      nextLevel,
      nextLevelName: nextLevel ? (LEVEL_NAMES[nextLevel] ?? null) : null,
      progressPercent: 0, // Simplified for now
    },

    availability: row.availability,
    availableForMentorship: row.available_for_mentorship === 1,
    yearsExperience: row.years_experience,
    websiteUrl: row.website_url,
    profileSlug: row.profile_slug,
    isPublic: row.is_public === 1,

    averageRating: row.average_rating,
    reviewCount: row.review_count,
    verifiedJobCount: row.verified_job_count,
    wouldHireAgainPercent: row.would_hire_again_percent,
    portfolioProjectCount: portfolioCount?.cnt ?? 0,
    productCount: 0, // Phase 3

    memberSince: row.member_since,
    lastActiveAt: row.last_active_at,
    serviceAreas: [],
    achievements: [],
  };
}

// ---------------------------------------------------------------------------
// FTS helper — called after profile/skill updates
// ---------------------------------------------------------------------------
async function updateProfileFts(db: D1Database, professionalId: string): Promise<void> {
  const profile = await findProfessionalByUserId(db, professionalId)
    ?? await dbFirst<{ id: string; display_name: string; business_name: string | null; tagline: string | null; bio: string | null }>(
      db, "SELECT id, display_name, business_name, tagline, bio FROM professional_profiles WHERE id = ?", professionalId
    );
  if (!profile) return;

  const skills = await getProfessionalSkills(db, professionalId);
  const skillText = skills.map((s) => s.name).join(" ");

  // Delete existing FTS row then re-insert (FTS5 contentless pattern)
  await db.prepare("DELETE FROM professional_search_fts WHERE professional_id = ?")
    .bind(professionalId).run();

  await db.prepare(
    `INSERT INTO professional_search_fts (professional_id, display_name, business_name, tagline, bio, skills, categories)
     VALUES (?, ?, ?, ?, ?, ?, '')`
  ).bind(
    professionalId,
    "display_name" in profile ? profile.display_name : "",
    "business_name" in profile ? (profile.business_name ?? "") : "",
    "tagline" in profile ? (profile.tagline ?? "") : "",
    "bio" in profile ? (profile.bio ?? "") : "",
    skillText
  ).run();
}

export { profiles as profilesRouter };
