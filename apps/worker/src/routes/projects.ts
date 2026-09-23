/**
 * Portfolio / project routes
 * GET  /api/projects/:id
 * GET  /api/profiles/:slug/projects
 * POST /api/projects              — create (professional)
 * PUT  /api/projects/:id          — update own
 * POST /api/projects/:id/publish  — publish draft
 * POST /api/projects/:id/media    — add media
 * POST /api/projects/:id/verify   — customer verifies project
 */

import { Hono } from "hono";
import {
  getProjectById,
  getProjectsByProfessional,
  createProject,
  publishProject,
  addProjectMedia,
  getProjectMedia,
  verifyProject,
  findProfessionalBySlug,
  findProfessionalByUserId,
} from "@guild/database";
import { CreateProjectSchema } from "@guild/validation";
import { assertOwnerOrAdmin, NotFoundError } from "@guild/auth";
import { UserRole } from "@guild/types";
import { isAllowedMimeType, isAllowedSize, R2_KEY_PREFIXES } from "@guild/config";
import type { Env, HonoVariables } from "../types";
import { ok, err, created, buildPaginationMeta, paginated } from "../utils/response";
import { validate } from "../utils/validate";
import { requireAuth } from "../middleware/auth";
import { apiRateLimit } from "../middleware/ratelimit";

const projects = new Hono<{ Bindings: Env; Variables: HonoVariables }>();

// ---------------------------------------------------------------------------
// GET /api/projects/:id
// ---------------------------------------------------------------------------
projects.get("/:id", async (c) => {
  const project = await getProjectById(c.env.DB, c.req.param("id"));
  if (!project || project.status !== "published") throw new NotFoundError("Project");
  const media = await getProjectMedia(c.env.DB, project.id);
  return ok(c, { ...project, media });
});

// ---------------------------------------------------------------------------
// GET /api/profiles/:slug/projects
// ---------------------------------------------------------------------------
projects.get("/by-profile/:slug", async (c) => {
  const profile = await findProfessionalBySlug(c.env.DB, c.req.param("slug"));
  if (!profile) throw new NotFoundError("Profile");

  const page = Number(c.req.query("page") ?? "1");
  const pageSize = Math.min(Number(c.req.query("pageSize") ?? "20"), 50);

  const items = await getProjectsByProfessional(c.env.DB, profile.id, page, pageSize);
  // Get total count
  const { dbFirst } = await import("@guild/database");
  const countRow = await dbFirst<{ cnt: number }>(
    c.env.DB,
    "SELECT COUNT(*) as cnt FROM projects WHERE professional_id = ? AND status = 'published'",
    profile.id
  );
  const total = countRow?.cnt ?? 0;

  return paginated(c, items, buildPaginationMeta(total, page, pageSize));
});

// ---------------------------------------------------------------------------
// POST /api/projects — create
// ---------------------------------------------------------------------------
projects.post("/", requireAuth, apiRateLimit, async (c) => {
  const role = c.get("userRole") as UserRole;
  if (role !== UserRole.Professional) {
    return err(c, "FORBIDDEN", "Only professionals can create projects.", 403);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = validate(CreateProjectSchema, body);
  if (!parsed.success) return err(c, "VALIDATION_ERROR", "Validation failed", 422, parsed.errors);

  const profile = await findProfessionalByUserId(c.env.DB, c.get("userId"));
  if (!profile) throw new NotFoundError("Professional profile");

  const project = await createProject(c.env.DB, profile.id, {
    title: parsed.data.title,
    description: parsed.data.description,
    completedDate: parsed.data.completedDate,
  });

  return created(c, project);
});

// ---------------------------------------------------------------------------
// POST /api/projects/:id/publish
// ---------------------------------------------------------------------------
projects.post("/:id/publish", requireAuth, async (c) => {
  const project = await getProjectById(c.env.DB, c.req.param("id"));
  if (!project) throw new NotFoundError("Project");

  const profile = await findProfessionalByUserId(c.env.DB, c.get("userId"));
  assertOwnerOrAdmin(profile?.id ?? "", project.professional_id, c.get("userRole") as UserRole);

  await publishProject(c.env.DB, project.id, project.professional_id);
  return ok(c, { message: "Project published." });
});

// ---------------------------------------------------------------------------
// PUT /api/projects/:id/media — upload project image
// ---------------------------------------------------------------------------
projects.put("/:id/media", requireAuth, async (c) => {
  const project = await getProjectById(c.env.DB, c.req.param("id"));
  if (!project) throw new NotFoundError("Project");

  const profile = await findProfessionalByUserId(c.env.DB, c.get("userId"));
  assertOwnerOrAdmin(profile?.id ?? "", project.professional_id, c.get("userRole") as UserRole);

  const contentType = c.req.header("Content-Type") ?? "";
  if (!isAllowedMimeType("projectImage", contentType)) {
    return err(c, "INVALID_MIME", "File type not allowed.", 400);
  }

  const phase = (c.req.query("phase") ?? "general") as "before" | "during" | "after" | "general";
  const body = await c.req.arrayBuffer();
  if (!isAllowedSize("projectImage", body.byteLength)) {
    return err(c, "FILE_TOO_LARGE", "File exceeds maximum size.", 400);
  }

  const ext = contentType.split("/")[1] ?? "jpg";
  const objectKey = `${R2_KEY_PREFIXES.projectImage}${project.id}/${phase}-${crypto.randomUUID()}.${ext}`;
  await c.env.MEDIA_BUCKET.put(objectKey, body, { httpMetadata: { contentType } });
  const url = `${c.env.MEDIA_BASE_URL}/${objectKey}`;

  const mediaId = await addProjectMedia(c.env.DB, project.id, { url, phase });
  return created(c, { id: mediaId, url, phase });
});

// ---------------------------------------------------------------------------
// POST /api/projects/:id/verify — customer verifies a completed project
// ---------------------------------------------------------------------------
projects.post("/:id/verify", requireAuth, async (c) => {
  const project = await getProjectById(c.env.DB, c.req.param("id"));
  if (!project) throw new NotFoundError("Project");
  if (project.verification_status === "verified") {
    return err(c, "ALREADY_VERIFIED", "This project is already verified.", 409);
  }

  await verifyProject(c.env.DB, project.id, c.get("userId"));
  return ok(c, { message: "Project verified." });
});

export { projects as projectsRouter };
