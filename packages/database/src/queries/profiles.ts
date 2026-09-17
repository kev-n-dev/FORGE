import { dbFirst, dbAll, dbRun, newId, now, type DB } from "../utils";

export interface ProfessionalProfileRow {
  id: string;
  user_id: string;
  display_name: string;
  business_name: string | null;
  tagline: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  location_country: string | null;
  location_region: string | null;
  location_city: string | null;
  location_country_code: string | null;
  service_area_description: string | null;
  availability: string;
  available_for_mentorship: number;
  years_experience: number | null;
  website_url: string | null;
  profile_slug: string;
  is_public: number;
  average_rating: number | null;
  review_count: number;
  verified_job_count: number;
  would_hire_again_percent: number | null;
  reputation_level: number;
  reputation_level_name: string;
  member_since: string;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function findProfessionalBySlug(
  db: DB,
  slug: string
): Promise<ProfessionalProfileRow | null> {
  return dbFirst<ProfessionalProfileRow>(
    db,
    "SELECT * FROM professional_profiles WHERE profile_slug = ? AND is_public = 1",
    slug
  );
}

export async function findProfessionalByUserId(
  db: DB,
  userId: string
): Promise<ProfessionalProfileRow | null> {
  return dbFirst<ProfessionalProfileRow>(
    db,
    "SELECT * FROM professional_profiles WHERE user_id = ?",
    userId
  );
}

export async function findProfessionalById(
  db: DB,
  id: string
): Promise<ProfessionalProfileRow | null> {
  return dbFirst<ProfessionalProfileRow>(
    db,
    "SELECT * FROM professional_profiles WHERE id = ?",
    id
  );
}

export async function createProfessionalProfile(
  db: DB,
  params: {
    userId: string;
    displayName: string;
    profileSlug: string;
    locationCountry?: string;
    locationCountryCode?: string;
  }
): Promise<ProfessionalProfileRow> {
  const id = newId();
  const ts = now();
  await dbRun(
    db,
    `INSERT INTO professional_profiles
       (id, user_id, display_name, profile_slug, availability, available_for_mentorship,
        location_country, location_country_code, reputation_level, reputation_level_name,
        review_count, verified_job_count, is_public, member_since, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'accepting_work', 0, ?, ?, 1, 'New', 0, 0, 1, ?, ?, ?)`,
    id,
    params.userId,
    params.displayName,
    params.profileSlug,
    params.locationCountry ?? null,
    params.locationCountryCode ?? null,
    ts,
    ts,
    ts
  );
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return (await findProfessionalById(db, id))!;
}

export async function updateProfessionalProfile(
  db: DB,
  id: string,
  params: Partial<{
    displayName: string;
    businessName: string | null;
    tagline: string | null;
    bio: string | null;
    locationCountry: string | null;
    locationRegion: string | null;
    locationCity: string | null;
    locationCountryCode: string | null;
    serviceAreaDescription: string | null;
    availability: string;
    availableForMentorship: boolean;
    yearsExperience: number | null;
    websiteUrl: string | null;
    isPublic: boolean;
  }>
): Promise<void> {
  await dbRun(
    db,
    `UPDATE professional_profiles SET
       display_name = COALESCE(?, display_name),
       business_name = ?,
       tagline = ?,
       bio = ?,
       location_country = ?,
       location_region = ?,
       location_city = ?,
       location_country_code = ?,
       service_area_description = ?,
       availability = COALESCE(?, availability),
       available_for_mentorship = COALESCE(?, available_for_mentorship),
       years_experience = ?,
       website_url = ?,
       is_public = COALESCE(?, is_public),
       updated_at = ?
     WHERE id = ?`,
    params.displayName ?? null,
    params.businessName ?? null,
    params.tagline ?? null,
    params.bio ?? null,
    params.locationCountry ?? null,
    params.locationRegion ?? null,
    params.locationCity ?? null,
    params.locationCountryCode ?? null,
    params.serviceAreaDescription ?? null,
    params.availability ?? null,
    params.availableForMentorship !== undefined ? (params.availableForMentorship ? 1 : 0) : null,
    params.yearsExperience ?? null,
    params.websiteUrl ?? null,
    params.isPublic !== undefined ? (params.isPublic ? 1 : 0) : null,
    now(),
    id
  );
}

export async function updateProfessionalAvatar(
  db: DB,
  professionalId: string,
  avatarUrl: string
): Promise<void> {
  await dbRun(
    db,
    "UPDATE professional_profiles SET avatar_url = ?, updated_at = ? WHERE id = ?",
    avatarUrl,
    now(),
    professionalId
  );
}

export async function updateProfessionalCover(
  db: DB,
  professionalId: string,
  coverUrl: string
): Promise<void> {
  await dbRun(
    db,
    "UPDATE professional_profiles SET cover_url = ?, updated_at = ? WHERE id = ?",
    coverUrl,
    now(),
    professionalId
  );
}

export async function getProfessionalSkills(
  db: DB,
  professionalId: string
): Promise<{ id: string; name: string; years_experience: number | null; featured: number }[]> {
  return dbAll(
    db,
    "SELECT id, name, years_experience, featured FROM professional_skills WHERE professional_id = ? ORDER BY featured DESC, name ASC",
    professionalId
  );
}

export async function addProfessionalSkill(
  db: DB,
  professionalId: string,
  params: { name: string; yearsExperience?: number; featured?: boolean }
): Promise<string> {
  const id = newId();
  await dbRun(
    db,
    `INSERT INTO professional_skills (id, professional_id, name, years_experience, featured, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    id,
    professionalId,
    params.name,
    params.yearsExperience ?? null,
    params.featured ? 1 : 0,
    now()
  );
  return id;
}

export async function removeProfessionalSkill(
  db: DB,
  skillId: string,
  professionalId: string
): Promise<void> {
  await dbRun(
    db,
    "DELETE FROM professional_skills WHERE id = ? AND professional_id = ?",
    skillId,
    professionalId
  );
}
