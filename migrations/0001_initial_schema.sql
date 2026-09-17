-- FORGE Database Schema — Migration 0001: Initial Schema
-- Cloudflare D1 (SQLite)
-- All timestamps stored as ISO 8601 strings.
-- Booleans stored as INTEGER 0/1.

-- ---------------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id                TEXT PRIMARY KEY NOT NULL,
  email             TEXT NOT NULL UNIQUE,
  email_verified    INTEGER NOT NULL DEFAULT 0,
  password_hash     TEXT NOT NULL,
  role              TEXT NOT NULL DEFAULT 'customer'
                      CHECK (role IN ('customer','professional','admin','super_admin')),
  status            TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','suspended','banned','pending_verification','deactivated')),
  mfa_enabled       INTEGER NOT NULL DEFAULT 0,
  mfa_secret        TEXT,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL,
  last_login_at     TEXT
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- ---------------------------------------------------------------------------
-- EMAIL VERIFICATION & PASSWORD RESET TOKENS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id          TEXT PRIMARY KEY NOT NULL,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TEXT NOT NULL,
  used_at     TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_evt_user ON email_verification_tokens(user_id);
CREATE INDEX idx_evt_token ON email_verification_tokens(token_hash);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          TEXT PRIMARY KEY NOT NULL,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TEXT NOT NULL,
  used_at     TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_prt_user ON password_reset_tokens(user_id);

-- ---------------------------------------------------------------------------
-- CATEGORIES
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS categories (
  id          TEXT PRIMARY KEY NOT NULL,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id   TEXT REFERENCES categories(id) ON DELETE SET NULL,
  icon        TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);

-- ---------------------------------------------------------------------------
-- PROFESSIONAL PROFILES
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS professional_profiles (
  id                        TEXT PRIMARY KEY NOT NULL,
  user_id                   TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name              TEXT NOT NULL,
  business_name             TEXT,
  tagline                   TEXT,
  bio                       TEXT,
  avatar_url                TEXT,
  cover_url                 TEXT,

  -- Public location (coarse — never exposes private address)
  location_country          TEXT,
  location_country_code     TEXT,
  location_region           TEXT,
  location_city             TEXT,
  service_area_description  TEXT,

  availability              TEXT NOT NULL DEFAULT 'accepting_work',
  available_for_mentorship  INTEGER NOT NULL DEFAULT 0,
  years_experience          INTEGER,
  website_url               TEXT,
  profile_slug              TEXT NOT NULL UNIQUE,
  is_public                 INTEGER NOT NULL DEFAULT 1,

  -- Cached stats (recalculated on events)
  average_rating            REAL,
  review_count              INTEGER NOT NULL DEFAULT 0,
  verified_job_count        INTEGER NOT NULL DEFAULT 0,
  would_hire_again_percent  INTEGER,
  reputation_level          INTEGER NOT NULL DEFAULT 1,
  reputation_level_name     TEXT NOT NULL DEFAULT 'New',

  member_since              TEXT NOT NULL,
  last_active_at            TEXT,
  created_at                TEXT NOT NULL,
  updated_at                TEXT NOT NULL
);

CREATE INDEX idx_pp_user_id ON professional_profiles(user_id);
CREATE INDEX idx_pp_slug ON professional_profiles(profile_slug);
CREATE INDEX idx_pp_country ON professional_profiles(location_country_code);
CREATE INDEX idx_pp_level ON professional_profiles(reputation_level);
CREATE INDEX idx_pp_rating ON professional_profiles(average_rating);
CREATE INDEX idx_pp_public ON professional_profiles(is_public);

-- ---------------------------------------------------------------------------
-- PROFESSIONAL CATEGORIES (many-to-many)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS professional_categories (
  id              TEXT PRIMARY KEY NOT NULL,
  professional_id TEXT NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  category_id     TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(professional_id, category_id)
);

CREATE INDEX idx_pc_prof ON professional_categories(professional_id);
CREATE INDEX idx_pc_cat ON professional_categories(category_id);

-- ---------------------------------------------------------------------------
-- PROFESSIONAL SKILLS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS professional_skills (
  id              TEXT PRIMARY KEY NOT NULL,
  professional_id TEXT NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  years_experience INTEGER,
  featured        INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL
);

CREATE INDEX idx_ps_prof ON professional_skills(professional_id);

-- ---------------------------------------------------------------------------
-- SERVICES
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS services (
  id              TEXT PRIMARY KEY NOT NULL,
  professional_id TEXT NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  category_id     TEXT REFERENCES categories(id),
  starting_price  REAL,
  currency        TEXT,
  price_unit      TEXT,
  is_active       INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE INDEX idx_svc_prof ON services(professional_id);

-- ---------------------------------------------------------------------------
-- SERVICE AREAS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS service_areas (
  id              TEXT PRIMARY KEY NOT NULL,
  professional_id TEXT NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  country         TEXT NOT NULL,
  region          TEXT,
  city            TEXT,
  radius_km       INTEGER,
  label           TEXT NOT NULL,
  created_at      TEXT NOT NULL
);

CREATE INDEX idx_sa_prof ON service_areas(professional_id);

-- ---------------------------------------------------------------------------
-- EXPERIENCE
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS experience_entries (
  id              TEXT PRIMARY KEY NOT NULL,
  professional_id TEXT NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  organization    TEXT,
  description     TEXT,
  start_date      TEXT NOT NULL, -- YYYY-MM
  end_date        TEXT,
  is_current      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL
);

CREATE INDEX idx_exp_prof ON experience_entries(professional_id);

-- ---------------------------------------------------------------------------
-- CREDENTIALS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS credentials (
  id                  TEXT PRIMARY KEY NOT NULL,
  professional_id     TEXT NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  issuing_organization TEXT NOT NULL,
  issue_date          TEXT NOT NULL,
  expiry_date         TEXT,
  credential_id       TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  is_public           INTEGER NOT NULL DEFAULT 1,
  created_at          TEXT NOT NULL
);

CREATE INDEX idx_cred_prof ON credentials(professional_id);

-- ---------------------------------------------------------------------------
-- EQUIPMENT
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS equipment (
  id              TEXT PRIMARY KEY NOT NULL,
  professional_id TEXT NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  category        TEXT,
  description     TEXT,
  created_at      TEXT NOT NULL
);

-- ---------------------------------------------------------------------------
-- MATERIALS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS material_specialties (
  id              TEXT PRIMARY KEY NOT NULL,
  professional_id TEXT NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  category        TEXT,
  created_at      TEXT NOT NULL
);

-- ---------------------------------------------------------------------------
-- SOCIAL LINKS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS social_links (
  id              TEXT PRIMARY KEY NOT NULL,
  professional_id TEXT NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL,
  url             TEXT NOT NULL,
  label           TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------------
-- VERIFICATIONS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS verifications (
  id                    TEXT PRIMARY KEY NOT NULL,
  professional_id       TEXT NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  type                  TEXT NOT NULL CHECK (type IN ('identity','business','credential','insurance')),
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('unverified','pending','verified','rejected','expired')),
  submitted_at          TEXT NOT NULL,
  reviewed_at           TEXT,
  reviewed_by_admin_id  TEXT REFERENCES users(id),
  expires_at            TEXT,
  rejection_reason      TEXT,
  notes                 TEXT,
  -- Document references stored as JSON array of R2 object keys
  -- NEVER exposed in public API — admin only
  document_keys         TEXT,
  created_at            TEXT NOT NULL,
  updated_at            TEXT NOT NULL
);

CREATE INDEX idx_ver_prof ON verifications(professional_id);
CREATE INDEX idx_ver_type ON verifications(type, status);

-- ---------------------------------------------------------------------------
-- PROJECTS (PORTFOLIO)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS projects (
  id                      TEXT PRIMARY KEY NOT NULL,
  professional_id         TEXT NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  title                   TEXT NOT NULL,
  description             TEXT,
  completed_date          TEXT, -- YYYY-MM
  status                  TEXT NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft','published','archived')),
  verification_status     TEXT NOT NULL DEFAULT 'portfolio'
                            CHECK (verification_status IN ('portfolio','verified','verified_job')),
  verified_at             TEXT,
  verified_by_customer_id TEXT REFERENCES users(id),
  job_id                  TEXT, -- FK set after job system added
  cover_image_url         TEXT,
  created_at              TEXT NOT NULL,
  updated_at              TEXT NOT NULL
);

CREATE INDEX idx_proj_prof ON projects(professional_id);
CREATE INDEX idx_proj_status ON projects(status);

-- ---------------------------------------------------------------------------
-- PROJECT MEDIA
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS project_media (
  id           TEXT PRIMARY KEY NOT NULL,
  project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  thumbnail_url TEXT,
  alt_text     TEXT,
  phase        TEXT NOT NULL DEFAULT 'general'
                 CHECK (phase IN ('before','during','after','general')),
  sort_order   INTEGER NOT NULL DEFAULT 0,
  media_type   TEXT NOT NULL DEFAULT 'image'
);

CREATE INDEX idx_pm_project ON project_media(project_id);

-- ---------------------------------------------------------------------------
-- PROJECT CATEGORIES (many-to-many)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS project_categories (
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, category_id)
);

-- ---------------------------------------------------------------------------
-- PROJECT COLLABORATORS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS project_collaborators (
  id              TEXT PRIMARY KEY NOT NULL,
  project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  professional_id TEXT NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  role            TEXT,
  created_at      TEXT NOT NULL,
  UNIQUE(project_id, professional_id)
);

-- ---------------------------------------------------------------------------
-- CUSTOMER PROFILES
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS customer_profiles (
  id           TEXT PRIMARY KEY NOT NULL,
  user_id      TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  first_name   TEXT NOT NULL,
  last_name    TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url   TEXT,
  location_country      TEXT,
  location_country_code TEXT,
  location_region       TEXT,
  location_city         TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

CREATE INDEX idx_cp_user ON customer_profiles(user_id);

-- ---------------------------------------------------------------------------
-- REVIEWS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS reviews (
  id              TEXT PRIMARY KEY NOT NULL,
  professional_id TEXT NOT NULL REFERENCES professional_profiles(id) ON DELETE RESTRICT,
  customer_id     TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  job_id          TEXT,
  product_id      TEXT,
  order_id        TEXT,
  rating          INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body            TEXT NOT NULL,
  would_hire_again INTEGER, -- 1=yes, 0=no, NULL=not answered
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','locked','flagged','removed','under_investigation')),
  edit_locked_at  TEXT, -- After this time, customer cannot edit
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE INDEX idx_rev_prof ON reviews(professional_id);
CREATE INDEX idx_rev_customer ON reviews(customer_id);
CREATE INDEX idx_rev_status ON reviews(status);

-- ---------------------------------------------------------------------------
-- REVIEW RESPONSES (professional reply)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS review_responses (
  id              TEXT PRIMARY KEY NOT NULL,
  review_id       TEXT NOT NULL UNIQUE REFERENCES reviews(id) ON DELETE CASCADE,
  professional_id TEXT NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  body            TEXT NOT NULL,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

-- ---------------------------------------------------------------------------
-- REPUTATION EVENTS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS reputation_events (
  id              TEXT PRIMARY KEY NOT NULL,
  professional_id TEXT NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL,
  source_type     TEXT NOT NULL,
  source_id       TEXT,
  value           REAL NOT NULL DEFAULT 0,
  description     TEXT NOT NULL,
  created_at      TEXT NOT NULL
);

CREATE INDEX idx_re_prof ON reputation_events(professional_id);
CREATE INDEX idx_re_type ON reputation_events(event_type);

-- ---------------------------------------------------------------------------
-- ACHIEVEMENTS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS achievements (
  id          TEXT PRIMARY KEY NOT NULL,
  code        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  icon        TEXT NOT NULL,
  category    TEXT NOT NULL,
  is_secret   INTEGER NOT NULL DEFAULT 0,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS earned_achievements (
  id              TEXT PRIMARY KEY NOT NULL,
  professional_id TEXT NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  achievement_id  TEXT NOT NULL REFERENCES achievements(id),
  earned_at       TEXT NOT NULL,
  UNIQUE(professional_id, achievement_id)
);

CREATE INDEX idx_ea_prof ON earned_achievements(professional_id);

-- ---------------------------------------------------------------------------
-- FOLLOWS / SAVES
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS follows (
  follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (follower_id, followee_id)
);

CREATE TABLE IF NOT EXISTS saved_professionals (
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  professional_id TEXT NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, professional_id)
);

-- ---------------------------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS notifications (
  id          TEXT PRIMARY KEY NOT NULL,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  action_url  TEXT,
  is_read     INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL,
  read_at     TEXT
);

CREATE INDEX idx_notif_user ON notifications(user_id, is_read);

-- ---------------------------------------------------------------------------
-- REPORTS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS reports (
  id                  TEXT PRIMARY KEY NOT NULL,
  reporter_id         TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  target_type         TEXT NOT NULL,
  target_id           TEXT NOT NULL,
  reason              TEXT NOT NULL,
  description         TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'reported'
                        CHECK (status IN ('reported','under_investigation','evidence_requested','resolved','confirmed_violation','dismissed')),
  admin_notes         TEXT,
  assigned_admin_id   TEXT REFERENCES users(id),
  resolution          TEXT,
  resolved_at         TEXT,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL
);

CREATE INDEX idx_rep_status ON reports(status);
CREATE INDEX idx_rep_target ON reports(target_type, target_id);

-- ---------------------------------------------------------------------------
-- AUDIT LOGS (append-only)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_logs (
  id              TEXT PRIMARY KEY NOT NULL,
  admin_id        TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action          TEXT NOT NULL,
  target_type     TEXT NOT NULL,
  target_id       TEXT NOT NULL,
  reason          TEXT NOT NULL,
  previous_state  TEXT, -- JSON
  new_state       TEXT, -- JSON
  created_at      TEXT NOT NULL
);

CREATE INDEX idx_al_admin ON audit_logs(admin_id);
CREATE INDEX idx_al_target ON audit_logs(target_type, target_id);
CREATE INDEX idx_al_created ON audit_logs(created_at);

-- ---------------------------------------------------------------------------
-- FEATURE FLAGS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS feature_flags (
  key         TEXT PRIMARY KEY NOT NULL,
  enabled     INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO feature_flags (key, enabled, description) VALUES
  ('MARKETPLACE_ENABLED',      0, 'Product marketplace'),
  ('JOBS_ENABLED',             0, 'Job board and quoting'),
  ('MESSAGING_ENABLED',        0, 'In-platform messaging'),
  ('RECOMMENDATIONS_ENABLED',  0, 'Professional recommendations'),
  ('MENTORSHIP_ENABLED',       0, 'Mentorship listings'),
  ('ADVERTISING_ENABLED',      0, 'Sponsored placements'),
  ('PAYMENTS_ENABLED',         0, 'Payment processing'),
  ('SOCIAL_FEED_ENABLED',      0, 'Professional activity feed');

-- ---------------------------------------------------------------------------
-- FULL-TEXT SEARCH (FTS5)
-- Used for professional search
-- ---------------------------------------------------------------------------

CREATE VIRTUAL TABLE IF NOT EXISTS professional_search_fts USING fts5(
  professional_id UNINDEXED,
  display_name,
  business_name,
  tagline,
  bio,
  skills,
  categories,
  content='',
  contentless_delete=1
);
