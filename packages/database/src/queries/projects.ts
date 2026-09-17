import { dbAll, dbFirst, dbRun, newId, now, offset, type DB } from "../utils";

export interface ProjectRow {
  id: string;
  professional_id: string;
  title: string;
  description: string | null;
  completed_date: string | null;
  status: string;
  verification_status: string;
  verified_at: string | null;
  verified_by_customer_id: string | null;
  job_id: string | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectMediaRow {
  id: string;
  project_id: string;
  url: string;
  thumbnail_url: string | null;
  alt_text: string | null;
  phase: string;
  sort_order: number;
  media_type: string;
}

export async function getProjectsByProfessional(
  db: DB,
  professionalId: string,
  page = 1,
  pageSize = 20
): Promise<ProjectRow[]> {
  return dbAll<ProjectRow>(
    db,
    `SELECT * FROM projects
     WHERE professional_id = ? AND status = 'published'
     ORDER BY completed_date DESC, created_at DESC
     LIMIT ? OFFSET ?`,
    professionalId,
    pageSize,
    offset(page, pageSize)
  );
}

export async function getProjectById(db: DB, id: string): Promise<ProjectRow | null> {
  return dbFirst<ProjectRow>(db, "SELECT * FROM projects WHERE id = ?", id);
}

export async function createProject(
  db: DB,
  professionalId: string,
  params: {
    title: string;
    description?: string | null;
    completedDate?: string | null;
  }
): Promise<ProjectRow> {
  const id = newId();
  const ts = now();
  await dbRun(
    db,
    `INSERT INTO projects
       (id, professional_id, title, description, completed_date, status, verification_status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'draft', 'portfolio', ?, ?)`,
    id,
    professionalId,
    params.title,
    params.description ?? null,
    params.completedDate ?? null,
    ts,
    ts
  );
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return (await getProjectById(db, id))!;
}

export async function publishProject(db: DB, id: string, professionalId: string): Promise<void> {
  await dbRun(
    db,
    "UPDATE projects SET status = 'published', updated_at = ? WHERE id = ? AND professional_id = ?",
    now(),
    id,
    professionalId
  );
}

export async function getProjectMedia(db: DB, projectId: string): Promise<ProjectMediaRow[]> {
  return dbAll<ProjectMediaRow>(
    db,
    "SELECT * FROM project_media WHERE project_id = ? ORDER BY sort_order ASC",
    projectId
  );
}

export async function addProjectMedia(
  db: DB,
  projectId: string,
  params: { url: string; thumbnailUrl?: string; altText?: string; phase: string; sortOrder?: number; mediaType?: string }
): Promise<string> {
  const id = newId();
  await dbRun(
    db,
    `INSERT INTO project_media (id, project_id, url, thumbnail_url, alt_text, phase, sort_order, media_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    projectId,
    params.url,
    params.thumbnailUrl ?? null,
    params.altText ?? null,
    params.phase,
    params.sortOrder ?? 0,
    params.mediaType ?? "image"
  );
  return id;
}

export async function verifyProject(
  db: DB,
  projectId: string,
  customerId: string
): Promise<void> {
  await dbRun(
    db,
    `UPDATE projects SET
       verification_status = 'verified',
       verified_at = ?,
       verified_by_customer_id = ?,
       updated_at = ?
     WHERE id = ?`,
    now(),
    customerId,
    now(),
    projectId
  );
}
