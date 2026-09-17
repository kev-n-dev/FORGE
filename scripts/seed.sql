-- FORGE Development Seed Data
-- All data is FICTIONAL and intended for development/testing only.
-- Run: pnpm seed:local
--
-- Seed users use the password: "Develop123" (hashed below)
-- Password hash: pbkdf2:sha-256:310000:<salt>:<hash> for "Develop123"
-- For dev, use the API to register real users, or update hashes as needed.

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
INSERT OR IGNORE INTO categories (id, name, slug, description, parent_id, sort_order, is_active) VALUES
  ('cat-trades',       'Trades',           'trades',          'Skilled trade professionals',  NULL, 0, 1),
  ('cat-makers',       'Makers & Crafts',  'makers-crafts',   'Independent makers and craftspeople', NULL, 1, 1),
  ('cat-carpenter',    'Carpentry',        'carpentry',       'Carpenters and woodwork professionals', 'cat-trades', 0, 1),
  ('cat-electrical',   'Electrical',       'electrical',      'Licensed electricians',        'cat-trades', 1, 1),
  ('cat-plumbing',     'Plumbing',         'plumbing',        'Plumbers and pipe fitters',    'cat-trades', 2, 1),
  ('cat-masonry',      'Masonry',          'masonry',         'Masons and concrete workers',  'cat-trades', 3, 1),
  ('cat-welding',      'Welding',          'welding',         'Welders and metal fabricators','cat-trades', 4, 1),
  ('cat-hvac',         'HVAC',             'hvac',            'HVAC technicians',             'cat-trades', 5, 1),
  ('cat-painting',     'Painting',         'painting',        'Painters — interior and exterior', 'cat-trades', 6, 1),
  ('cat-landscaping',  'Landscaping',      'landscaping',     'Landscapers and garden professionals', 'cat-trades', 7, 1),
  ('cat-mechanic',     'Auto Mechanics',   'auto-mechanics',  'Automotive technicians',       'cat-trades', 8, 1),
  ('cat-woodworking',  'Woodworking',      'woodworking',     'Woodworkers and furniture makers', 'cat-makers', 0, 1),
  ('cat-furniture',    'Furniture Making', 'furniture-making','Furniture designers and builders', 'cat-makers', 1, 1),
  ('cat-leather',      'Leather Work',     'leather-work',    'Leather goods and accessories','cat-makers', 2, 1),
  ('cat-pottery',      'Pottery',          'pottery',         'Potters and ceramic artists',  'cat-makers', 3, 1),
  ('cat-jewelry',      'Jewelry Making',   'jewelry-making',  'Jewelers and metalworkers',    'cat-makers', 4, 1);

-- ---------------------------------------------------------------------------
-- Achievements (platform milestones)
-- ---------------------------------------------------------------------------
INSERT OR IGNORE INTO achievements (id, code, name, description, icon, category, sort_order) VALUES
  ('ach-100-jobs',  '100_verified_jobs',   '100 Verified Jobs',     'Completed 100 verified jobs on FORGE', '🏆', 'jobs', 0),
  ('ach-50-5star',  '50_five_star',        '50 Five-Star Reviews',  'Received 50 five-star reviews',        '⭐', 'reviews', 1),
  ('ach-1yr',       '1_year_member',       '1 Year on FORGE',       'Active member for one year',           '🔥', 'milestones', 2),
  ('ach-mentor',    'community_mentor',    'Community Mentor',      'Offered mentorship to other professionals', '🤝', 'community', 3),
  ('ach-100-orders','100_orders',          '100 Orders',            'Fulfilled 100 product orders',         '📦', 'marketplace', 4),
  ('ach-50-projects','50_projects',        '50 Completed Projects', 'Published 50 portfolio projects',      '🛠', 'portfolio', 5);

-- ---------------------------------------------------------------------------
-- Seed users (fictional professionals)
-- Password: "Develop123" — REPLACE hash for any real testing
-- ---------------------------------------------------------------------------

-- Marcus Williams — Carpenter / Woodworker / Furniture Maker
INSERT OR IGNORE INTO users (id, email, email_verified, password_hash, role, status, created_at, updated_at) VALUES
  ('user-marcus', 'marcus@devonly.forge', 1,
   'pbkdf2:sha-256:310000:devSeedSaltAAAAAA==:devSeedHashAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
   'professional', 'active', '2024-03-15T10:00:00Z', '2024-03-15T10:00:00Z');

INSERT OR IGNORE INTO professional_profiles (
  id, user_id, display_name, business_name, tagline, bio,
  location_country, location_country_code, location_region, location_city,
  service_area_description, availability, available_for_mentorship, years_experience,
  profile_slug, is_public, average_rating, review_count, verified_job_count,
  would_hire_again_percent, reputation_level, reputation_level_name,
  member_since, created_at, updated_at
) VALUES (
  'prof-marcus', 'user-marcus', 'Marcus Williams', 'Marcus Woodworks',
  'Carpenter · Woodworker · Furniture Maker',
  'I have been working with wood for over 15 years. I specialise in custom cabinetry, furniture, and residential renovations. Every project gets the same attention to detail whether it is a small repair or a full kitchen renovation.',
  'Trinidad and Tobago', 'TT', 'North-West Trinidad', 'Port of Spain',
  'Port of Spain, Maraval, Diego Martin, Westmoorings',
  'accepting_work', 1, 15,
  'marcus-woodworks-dev1', 1, 4.9, 127, 86, 94, 4, 'Proven',
  '2024-03-15T10:00:00Z', '2024-03-15T10:00:00Z', '2026-09-01T12:00:00Z'
);

INSERT OR IGNORE INTO professional_categories (id, professional_id, category_id, created_at) VALUES
  ('pc-marcus-1', 'prof-marcus', 'cat-carpenter',   '2024-03-15T10:00:00Z'),
  ('pc-marcus-2', 'prof-marcus', 'cat-woodworking', '2024-03-15T10:00:00Z'),
  ('pc-marcus-3', 'prof-marcus', 'cat-furniture',   '2024-03-15T10:00:00Z');

INSERT OR IGNORE INTO professional_skills (id, professional_id, name, years_experience, featured, created_at) VALUES
  ('sk-m1', 'prof-marcus', 'Carpentry',           15, 1, '2024-03-15T10:00:00Z'),
  ('sk-m2', 'prof-marcus', 'Cabinetry',           12, 1, '2024-03-15T10:00:00Z'),
  ('sk-m3', 'prof-marcus', 'Furniture Making',    10, 1, '2024-03-15T10:00:00Z'),
  ('sk-m4', 'prof-marcus', 'Joinery',              8, 0, '2024-03-15T10:00:00Z'),
  ('sk-m5', 'prof-marcus', 'Wood Finishing',       8, 0, '2024-03-15T10:00:00Z'),
  ('sk-m6', 'prof-marcus', 'Kitchen Renovation',  10, 1, '2024-03-15T10:00:00Z');

-- David St. Bernard — Mason
INSERT OR IGNORE INTO users (id, email, email_verified, password_hash, role, status, created_at, updated_at) VALUES
  ('user-david', 'david@devonly.forge', 1,
   'pbkdf2:sha-256:310000:devSeedSaltBBBBBB==:devSeedHashBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
   'professional', 'active', '2024-01-10T09:00:00Z', '2024-01-10T09:00:00Z');

INSERT OR IGNORE INTO professional_profiles (
  id, user_id, display_name, business_name, tagline, bio,
  location_country, location_country_code, location_region, location_city,
  availability, available_for_mentorship, years_experience,
  profile_slug, is_public, average_rating, review_count, verified_job_count,
  would_hire_again_percent, reputation_level, reputation_level_name,
  member_since, created_at, updated_at
) VALUES (
  'prof-david', 'user-david', 'David St. Bernard', 'David Masonry',
  'Mason · Concrete Specialist · Block Work',
  'Master mason with 20 years of experience. I handle everything from foundation work to decorative stonework. Licensed and insured.',
  'Trinidad and Tobago', 'TT', 'Central Trinidad', 'Chaguanas',
  'accepting_work', 0, 20,
  'david-masonry-dev1', 1, 4.7, 89, 71, 91, 4, 'Proven',
  '2024-01-10T09:00:00Z', '2024-01-10T09:00:00Z', '2026-08-20T08:00:00Z'
);

INSERT OR IGNORE INTO professional_categories (id, professional_id, category_id, created_at) VALUES
  ('pc-david-1', 'prof-david', 'cat-masonry', '2024-01-10T09:00:00Z');

INSERT OR IGNORE INTO professional_skills (id, professional_id, name, years_experience, featured, created_at) VALUES
  ('sk-d1', 'prof-david', 'Block Work',            20, 1, '2024-01-10T09:00:00Z'),
  ('sk-d2', 'prof-david', 'Concrete Work',         20, 1, '2024-01-10T09:00:00Z'),
  ('sk-d3', 'prof-david', 'Foundation Construction',18, 1, '2024-01-10T09:00:00Z'),
  ('sk-d4', 'prof-david', 'Retaining Walls',       15, 0, '2024-01-10T09:00:00Z');

-- Sarah Phillip — Electrician
INSERT OR IGNORE INTO users (id, email, email_verified, password_hash, role, status, created_at, updated_at) VALUES
  ('user-sarah', 'sarah@devonly.forge', 1,
   'pbkdf2:sha-256:310000:devSeedSaltCCCCCC==:devSeedHashCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC=',
   'professional', 'active', '2024-05-20T14:00:00Z', '2024-05-20T14:00:00Z');

INSERT OR IGNORE INTO professional_profiles (
  id, user_id, display_name, business_name, tagline, bio,
  location_country, location_country_code, location_region, location_city,
  availability, available_for_mentorship, years_experience,
  profile_slug, is_public, average_rating, review_count, verified_job_count,
  would_hire_again_percent, reputation_level, reputation_level_name,
  member_since, created_at, updated_at
) VALUES (
  'prof-sarah', 'user-sarah', 'Sarah Phillip', 'Sarah Electrical Services',
  'Licensed Electrician · Residential & Commercial',
  'Licensed electrician with 10 years of experience. I handle residential rewiring, panel upgrades, EV charger installation, and commercial fit-outs. Safety is my priority on every job.',
  'Trinidad and Tobago', 'TT', 'North Trinidad', 'Arima',
  'accepting_work', 1, 10,
  'sarah-electrical-dev1', 1, 4.8, 52, 44, 96, 3, 'Trusted',
  '2024-05-20T14:00:00Z', '2024-05-20T14:00:00Z', '2026-09-10T16:00:00Z'
);

INSERT OR IGNORE INTO professional_categories (id, professional_id, category_id, created_at) VALUES
  ('pc-sarah-1', 'prof-sarah', 'cat-electrical', '2024-05-20T14:00:00Z');

-- John Mohammed — Auto Mechanic
INSERT OR IGNORE INTO users (id, email, email_verified, password_hash, role, status, created_at, updated_at) VALUES
  ('user-john', 'john@devonly.forge', 1,
   'pbkdf2:sha-256:310000:devSeedSaltDDDDDD==:devSeedHashDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD=',
   'professional', 'active', '2024-02-01T08:00:00Z', '2024-02-01T08:00:00Z');

INSERT OR IGNORE INTO professional_profiles (
  id, user_id, display_name, business_name, tagline, bio,
  location_country, location_country_code, location_region, location_city,
  availability, available_for_mentorship, years_experience,
  profile_slug, is_public, average_rating, review_count, verified_job_count,
  would_hire_again_percent, reputation_level, reputation_level_name,
  member_since, created_at, updated_at
) VALUES (
  'prof-john', 'user-john', 'John Mohammed', 'John Auto Works',
  'Automotive Technician · Diagnostics · All Makes',
  'Over 12 years as an automotive technician. Specialise in engine diagnostics, brake systems, and general servicing. Japanese and European vehicles welcome.',
  'Trinidad and Tobago', 'TT', 'East-West Corridor', 'San Juan',
  'accepting_work', 0, 12,
  'john-auto-works-dev1', 1, 4.6, 38, 31, 87, 3, 'Trusted',
  '2024-02-01T08:00:00Z', '2024-02-01T08:00:00Z', '2026-07-15T10:00:00Z'
);

INSERT OR IGNORE INTO professional_categories (id, professional_id, category_id, created_at) VALUES
  ('pc-john-1', 'prof-john', 'cat-mechanic', '2024-02-01T08:00:00Z');

-- ---------------------------------------------------------------------------
-- Seed customer
-- ---------------------------------------------------------------------------
INSERT OR IGNORE INTO users (id, email, email_verified, password_hash, role, status, created_at, updated_at) VALUES
  ('user-customer1', 'customer@devonly.forge', 1,
   'pbkdf2:sha-256:310000:devSeedSaltEEEEEE==:devSeedHashEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE=',
   'customer', 'active', '2025-01-15T10:00:00Z', '2025-01-15T10:00:00Z');

INSERT OR IGNORE INTO customer_profiles (id, user_id, first_name, last_name, display_name, location_country, location_country_code, created_at, updated_at) VALUES
  ('cust-1', 'user-customer1', 'Alex', 'Chen', 'Alex Chen', 'Trinidad and Tobago', 'TT', '2025-01-15T10:00:00Z', '2025-01-15T10:00:00Z');

-- ---------------------------------------------------------------------------
-- Seed admin user
-- ---------------------------------------------------------------------------
INSERT OR IGNORE INTO users (id, email, email_verified, password_hash, role, status, created_at, updated_at) VALUES
  ('user-admin', 'admin@devonly.forge', 1,
   'pbkdf2:sha-256:310000:devSeedSaltFFFFFF==:devSeedHashFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF=',
   'admin', 'active', '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z');

-- ---------------------------------------------------------------------------
-- Seed portfolio projects for Marcus
-- ---------------------------------------------------------------------------
INSERT OR IGNORE INTO projects (id, professional_id, title, description, completed_date, status, verification_status, cover_image_url, created_at, updated_at) VALUES
  ('proj-marcus-1', 'prof-marcus',
   'Kitchen Cabinet Installation — Port of Spain',
   'Full kitchen cabinet installation including custom oak cabinetry, soft-close hinges, and integrated lighting. Before and after photos available.',
   '2026-03', 'published', 'verified', NULL,
   '2026-03-15T10:00:00Z', '2026-04-01T10:00:00Z'),
  ('proj-marcus-2', 'prof-marcus',
   'Walnut Dining Table',
   'Custom-made solid American walnut dining table, seats 8. 84" x 42". Finished with Rubio Monocoat.',
   '2026-05', 'published', 'portfolio', NULL,
   '2026-05-10T09:00:00Z', '2026-05-20T09:00:00Z');

-- ---------------------------------------------------------------------------
-- Seed reviews for Marcus
-- ---------------------------------------------------------------------------
INSERT OR IGNORE INTO reviews (id, professional_id, customer_id, rating, body, would_hire_again, status, edit_locked_at, created_at, updated_at) VALUES
  ('rev-1', 'prof-marcus', 'user-customer1', 5,
   'Marcus did an excellent job installing our kitchen cabinets. He was on time, cleaned up after himself, and the quality of the work is outstanding. The cabinets fit perfectly and the finishing is superb.',
   1, 'locked', '2026-06-03T10:00:00Z', '2026-06-01T10:00:00Z', '2026-06-01T10:00:00Z'),
  ('rev-2', 'prof-marcus', 'user-customer1', 5,
   'We hired Marcus to build a custom coffee table for our living room. He was professional, communicated well throughout the process, and delivered exactly what we discussed. Highly recommend.',
   1, 'locked', '2026-04-05T14:00:00Z', '2026-04-03T14:00:00Z', '2026-04-03T14:00:00Z');

-- ---------------------------------------------------------------------------
-- Seed reputation events for Marcus
-- ---------------------------------------------------------------------------
INSERT OR IGNORE INTO reputation_events (id, professional_id, event_type, source_type, source_id, value, description, created_at) VALUES
  ('re-m1', 'prof-marcus', 'verified_job_completed', 'job', 'job-seed-1', 1, 'Completed verified job: Kitchen Cabinet Installation', '2026-03-20T10:00:00Z'),
  ('re-m2', 'prof-marcus', 'review_received',         'review', 'rev-1', 5, 'Received 5-star review', '2026-06-01T10:00:00Z'),
  ('re-m3', 'prof-marcus', 'review_received',         'review', 'rev-2', 5, 'Received 5-star review', '2026-04-03T14:00:00Z');

-- ---------------------------------------------------------------------------
-- Seed earned achievements for Marcus
-- ---------------------------------------------------------------------------
INSERT OR IGNORE INTO earned_achievements (id, professional_id, achievement_id, earned_at) VALUES
  ('ea-m1', 'prof-marcus', 'ach-1yr',    '2025-03-15T10:00:00Z'),
  ('ea-m2', 'prof-marcus', 'ach-50-5star','2026-01-10T10:00:00Z');

-- ---------------------------------------------------------------------------
-- FTS index for seeded professionals
-- ---------------------------------------------------------------------------
INSERT INTO professional_search_fts (professional_id, display_name, business_name, tagline, bio, skills, categories)
  SELECT
    id,
    display_name,
    COALESCE(business_name, ''),
    COALESCE(tagline, ''),
    COALESCE(bio, ''),
    '',
    ''
  FROM professional_profiles
  WHERE id IN ('prof-marcus', 'prof-david', 'prof-sarah', 'prof-john')
  ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Development note
-- ---------------------------------------------------------------------------
-- All data above is FICTIONAL.
-- "devonly.forge" email addresses are intentionally invalid domains.
-- Do not use these accounts in production.
-- Seed password hashes are intentionally invalid — use the API to set real passwords.
