import { dbAll, dbFirst, dbRun, newId, now, type DB } from "../utils";
import { ReputationLevel } from "@guild/types";

export interface ReputationEventRow {
  id: string;
  professional_id: string;
  event_type: string;
  source_type: string;
  source_id: string | null;
  value: number;
  description: string;
  created_at: string;
}

/**
 * Level thresholds — all requirements must be met to advance.
 * Using a multi-signal approach with diminishing returns to prevent farming.
 */
export const LEVEL_REQUIREMENTS: Record<
  ReputationLevel,
  { verifiedJobs: number; reviews: number; minRating: number | null; months: number }
> = {
  [ReputationLevel.New]: { verifiedJobs: 0, reviews: 0, minRating: null, months: 0 },
  [ReputationLevel.Established]: { verifiedJobs: 5, reviews: 3, minRating: 3.5, months: 1 },
  [ReputationLevel.Trusted]: { verifiedJobs: 20, reviews: 15, minRating: 4.0, months: 3 },
  [ReputationLevel.Proven]: { verifiedJobs: 50, reviews: 40, minRating: 4.2, months: 6 },
  [ReputationLevel.Master]: { verifiedJobs: 100, reviews: 80, minRating: 4.5, months: 12 },
  [ReputationLevel.Legacy]: { verifiedJobs: 200, reviews: 150, minRating: 4.7, months: 24 },
};

export const LEVEL_NAMES: Record<ReputationLevel, string> = {
  [ReputationLevel.New]: "New",
  [ReputationLevel.Established]: "Established",
  [ReputationLevel.Trusted]: "Trusted",
  [ReputationLevel.Proven]: "Proven",
  [ReputationLevel.Master]: "Master",
  [ReputationLevel.Legacy]: "Legacy",
};

export async function recordReputationEvent(
  db: DB,
  professionalId: string,
  params: {
    eventType: string;
    sourceType: string;
    sourceId?: string;
    value: number;
    description: string;
  }
): Promise<void> {
  await dbRun(
    db,
    `INSERT INTO reputation_events
       (id, professional_id, event_type, source_type, source_id, value, description, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    newId(),
    professionalId,
    params.eventType,
    params.sourceType,
    params.sourceId ?? null,
    params.value,
    params.description,
    now()
  );
}

export async function getReputationEvents(
  db: DB,
  professionalId: string
): Promise<ReputationEventRow[]> {
  return dbAll<ReputationEventRow>(
    db,
    "SELECT * FROM reputation_events WHERE professional_id = ? ORDER BY created_at ASC",
    professionalId
  );
}

/**
 * Recalculate and persist the professional's reputation level.
 * Called after significant events (verified job, review, etc.).
 * All evidence is stored — level is derived, never manually assigned.
 */
export async function recalculateReputationLevel(
  db: DB,
  professionalId: string
): Promise<ReputationLevel> {
  // Gather signals
  const profile = await dbFirst<{
    average_rating: number | null;
    review_count: number;
    verified_job_count: number;
    member_since: string;
  }>(
    db,
    "SELECT average_rating, review_count, verified_job_count, member_since FROM professional_profiles WHERE id = ?",
    professionalId
  );

  if (!profile) return ReputationLevel.New;

  const monthsActive = Math.floor(
    (Date.now() - new Date(profile.member_since).getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  // Find highest level whose requirements are all met
  let earnedLevel = ReputationLevel.New;
  for (const levelNum of [6, 5, 4, 3, 2] as ReputationLevel[]) {
    const req = LEVEL_REQUIREMENTS[levelNum];
    if (!req) continue;
    const ratingOk =
      req.minRating === null ||
      (profile.average_rating !== null && profile.average_rating >= req.minRating);
    if (
      profile.verified_job_count >= req.verifiedJobs &&
      profile.review_count >= req.reviews &&
      ratingOk &&
      monthsActive >= req.months
    ) {
      earnedLevel = levelNum;
      break;
    }
  }

  const levelName = LEVEL_NAMES[earnedLevel] ?? "New";

  await dbRun(
    db,
    "UPDATE professional_profiles SET reputation_level = ?, reputation_level_name = ?, updated_at = ? WHERE id = ?",
    earnedLevel,
    levelName,
    now(),
    professionalId
  );

  return earnedLevel;
}
