import { dbAll, dbFirst, dbRun, newId, now, offset, type DB } from "../utils";

export interface AuditLogRow {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  reason: string;
  previous_state: string | null;
  new_state: string | null;
  created_at: string;
}

/** Append-only audit log insert — never update or delete audit rows. */
export async function createAuditLog(
  db: DB,
  params: {
    adminId: string;
    action: string;
    targetType: string;
    targetId: string;
    reason: string;
    previousState?: unknown;
    newState?: unknown;
  }
): Promise<void> {
  await dbRun(
    db,
    `INSERT INTO audit_logs (id, admin_id, action, target_type, target_id, reason, previous_state, new_state, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    newId(),
    params.adminId,
    params.action,
    params.targetType,
    params.targetId,
    params.reason,
    params.previousState !== undefined ? JSON.stringify(params.previousState) : null,
    params.newState !== undefined ? JSON.stringify(params.newState) : null,
    now()
  );
}

export async function getAuditLogs(
  db: DB,
  filters: { targetType?: string; targetId?: string; adminId?: string; page?: number; pageSize?: number }
): Promise<AuditLogRow[]> {
  const conditions: string[] = [];
  const bindings: unknown[] = [];

  if (filters.targetType) { conditions.push("target_type = ?"); bindings.push(filters.targetType); }
  if (filters.targetId) { conditions.push("target_id = ?"); bindings.push(filters.targetId); }
  if (filters.adminId) { conditions.push("admin_id = ?"); bindings.push(filters.adminId); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 50;

  return dbAll<AuditLogRow>(
    db,
    `SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    ...bindings,
    pageSize,
    offset(page, pageSize)
  );
}

export interface ReportRow {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  description: string;
  status: string;
  admin_notes: string | null;
  assigned_admin_id: string | null;
  resolution: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function createReport(
  db: DB,
  params: {
    reporterId: string;
    targetType: string;
    targetId: string;
    reason: string;
    description: string;
  }
): Promise<ReportRow> {
  const id = newId();
  const ts = now();
  await dbRun(
    db,
    `INSERT INTO reports (id, reporter_id, target_type, target_id, reason, description, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'reported', ?, ?)`,
    id,
    params.reporterId,
    params.targetType,
    params.targetId,
    params.reason,
    params.description,
    ts,
    ts
  );
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return (await dbFirst<ReportRow>(db, "SELECT * FROM reports WHERE id = ?", id))!;
}

export async function updateReportStatus(
  db: DB,
  reportId: string,
  adminId: string,
  status: string,
  adminNotes?: string,
  resolution?: string
): Promise<void> {
  const resolvedAt = ["resolved", "confirmed_violation", "dismissed"].includes(status)
    ? now()
    : null;

  await dbRun(
    db,
    `UPDATE reports SET
       status = ?,
       admin_notes = COALESCE(?, admin_notes),
       assigned_admin_id = ?,
       resolution = COALESCE(?, resolution),
       resolved_at = COALESCE(?, resolved_at),
       updated_at = ?
     WHERE id = ?`,
    status,
    adminNotes ?? null,
    adminId,
    resolution ?? null,
    resolvedAt,
    now(),
    reportId
  );
}

export async function getOpenReports(
  db: DB,
  page = 1,
  pageSize = 50
): Promise<ReportRow[]> {
  return dbAll<ReportRow>(
    db,
    `SELECT * FROM reports WHERE status IN ('reported','under_investigation','evidence_requested')
     ORDER BY created_at ASC LIMIT ? OFFSET ?`,
    pageSize,
    offset(page, pageSize)
  );
}
