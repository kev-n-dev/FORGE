/**
 * Professional profile routes
 * GET  /api/profiles/:slug          — public profile
 * GET  /api/profiles/me             — own profile (authenticated)
 * PUT  /api/profiles/me             — update own profile
 * POST /api/profiles/me/avatar      — upload avatar
 * POST /api/profiles/me/cover       — upload cover
 * GET  /api/profiles/:slug/skills
 * POST /api/profiles/me/skills
 * DELETE /api/profiles/me/skills/:id
 * GET  /api/profiles/:slug/services
 * POST /api/profiles/me/services
 * GET  /api/profiles/:slug/trust-card
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
  updateProfessionalCover,
  getAllActiveCategories,
} from "@forge/database";
import {
  UpdateProfessionalProfileSchema,
  AddSkillSchema,
  AddServiceSchema,
} from "@forge/validation";
import { isAllowedMimeType, isAllowedSize, R2_KEY_PREFIXES, UPLOAD_URL_TTL_SECONDS } from "@forge/config";
import { assertOwnerOrAdmin, NotFoundError } from "@forge/auth";
import { UserRole } from "@forge/types";
import type { Env, HonoVariables } from "../types";
import { ok, err, created } from "../utils/response";
import { validate } from "../utils/validate";
import { requireAuth, optionalAuth } from "../middleware/auth";
import { apiRateLimit } from "../middleware/ratelimit";
import { dbRun, dbFirst, newId, now } from "@forge/database";

const profiles = new Hono<{ Bindings: Env; Variables: HonoVariables }>();

// ---------------------------------------------------------------------------
// GET /api/profiles/:slug — public
// ---------------------------------------------------------------------------
profiles.get("/:slug", optionalAuth, async (c) => {
  const slug = c.req.param("slug");
  const profile = await findProfessionalBySlug(c.env.DB, slug);
  if (!profile) throw new NotFoundError("Profile");

  return ok(c, profile);
});

// ---------------------------------------------------------------------------
// GET /api/profiles/me — own profile
// ---------------------------------------------------------------------------
profiles.get("/me", requireAuth, async (c) => {
  const profile = await findProfessionalByUserId(c.env.DB, c.get("userId"));
  if (!profile) throw new NotFoundError("Professional profile");
  return ok(c, profile);
});

// ---------------------------------------------------------------------------
// PUT /api/profiles/me — update own profile
// ---------------------------------------------------------------------------
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

  const updated = await findProfessionalByUserId(c.env.DB, c.get("userId"));
  return ok(c, updated);
});

// ---------------------------------------------------------------------------
// POST /api/profiles/me/avatar — get signed upload URL for avatar
// ---------------------------------------------------------------------------
profiles.post("/me/avatar", requireAuth, async (c) => {
  const profile = await findProfessionalByUserId(c.env.DB, c.get("userId"));
  if (!profile) throw new NotFoundError("Professional profile");

  const body = await c.req.json().catch(() => null) as { mimeType?: string; sizeBytes?: number } | null;
  const mimeType = body?.mimeType ?? "image/jpeg";
  const sizeBytes = body?.sizeBytes ?? 0;

  if (!isAllowedMimeType("avatar", mimeType)) {
    return err(c, "INVALID_MIME", "File type not allowed for avatars.", 400);
  }
  if (!isAllowedSize("avatar", sizeBytes)) {
    return err(c, "FILE_TOO_LARGE", "File exceeds maximum size for avatars.", 400);
  }

  const objectKey = `${R2_KEY_PREFIXES.avatar}${profile.id}/${crypto.randomUUID()}`;
  const ext = mimeType.split("/")[1] ?? "jpg";
  const finalKey = `${objectKey}.${ext}`;

  // R2 signed upload URL
  const uploadUrl = await (c.env.MEDIA_BUCKET as R2Bucket & {
    createMultipartUpload: unknown;
    // Standard presigned URL generation not yet in workers-types, use workaround
  });

  // Return the key for a direct PUT — caller uses presigned URL pattern
  // The actual presigned URL would use: c.env.MEDIA_BUCKET.createSignedUrl(...)
  // This placeholder returns the key; wrangler r2 presigning is done at CF edge.
  return ok(c, {
    uploadId: finalKey,
    objectKey: finalKey,
    // In production, use a Worker R2 binding or Cloudflare Images API for presigned URLs
    message: "Upload via PUT to /api/profiles/me/avatar/upload with key.",
  });
});

// ---------------------------------------------------------------------------
// PUT /api/profiles/me/avatar/upload — accept avatar upload directly
// ---------------------------------------------------------------------------
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

  await c.env.MEDIA_BUCKET.put(objectKey, body, {
    httpMetadata: { contentType },
  });

  const publicUrl = `${c.env.MEDIA_BASE_URL}/${objectKey}`;
  await updateProfessionalAvatar(c.env.DB, profile.id, publicUrl);

  return ok(c, { avatarUrl: publicUrl });
});

// ---------------------------------------------------------------------------
// GET /api/profiles/:slug/skills
// ---------------------------------------------------------------------------
profiles.get("/:slug/skills", async (c) => {
  const slug = c.req.param("slug");
  const profile = await findProfessionalBySlug(c.env.DB, slug);
  if (!profile) throw new NotFoundError("Profile");
  const skills = await getProfessionalSkills(c.env.DB, profile.id);
  return ok(c, skills);
});

// ---------------------------------------------------------------------------
// POST /api/profiles/me/skills
// ---------------------------------------------------------------------------
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

  return created(c, { id, name: parsed.data.name });
});

// ---------------------------------------------------------------------------
// DELETE /api/profiles/me/skills/:skillId
// ---------------------------------------------------------------------------
profiles.delete("/me/skills/:skillId", requireAuth, async (c) => {
  const profile = await findProfessionalByUserId(c.env.DB, c.get("userId"));
  if (!profile) throw new NotFoundError("Professional profile");

  await removeProfessionalSkill(c.env.DB, c.req.param("skillId"), profile.id);
  return ok(c, { message: "Skill removed." });
});

// ---------------------------------------------------------------------------
// GET /api/profiles/:slug/trust-card
// ---------------------------------------------------------------------------
profiles.get("/:slug/trust-card", async (c) => {
  const slug = c.req.param("slug");
  const profile = await findProfessionalBySlug(c.env.DB, slug);
  if (!profile) throw new NotFoundError("Profile");

  // Gather verification badges
  const verifications = await dbFirst<{ identity: number; business: number }>(
    c.env.DB,
    `SELECT
       MAX(CASE WHEN type='identity' AND status='verified' THEN 1 ELSE 0 END) as identity,
       MAX(CASE WHEN type='business' AND status='verified' THEN 1 ELSE 0 END) as business
     FROM verifications WHERE professional_id = ?`,
    profile.id
  );

  const memberSinceDate = new Date(profile.member_since);
  const yearsActive = Math.floor(
    (Date.now() - memberSinceDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
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
  );

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
// GET /api/profiles/categories — all active categories
// ---------------------------------------------------------------------------
profiles.get("/categories", async (c) => {
  const cats = await getAllActiveCategories(c.env.DB);
  return ok(c, cats);
});

export { profiles as profilesRouter };
