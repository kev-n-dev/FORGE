# FORGE Database Design

Cloudflare D1 (SQLite). Migration files in `migrations/`.

## Key Design Decisions

- UUID primary keys generated with `crypto.randomUUID()` (available in Workers)
- ISO 8601 string timestamps (SQLite has no native timestamp type)
- Boolean values stored as INTEGER 0/1
- JSON stored as TEXT for complex structured data
- Foreign keys explicitly defined and enforced
- FTS5 virtual table for full-text search on professional profiles
- Audit logs are append-only — no UPDATE or DELETE allowed via the application

## Core Entity Relationships

```
User (1) ──── (1) ProfessionalProfile
User (1) ──── (1) CustomerProfile
ProfessionalProfile (1) ──── (n) Services
ProfessionalProfile (1) ──── (n) Projects ──── (n) ProjectMedia
ProfessionalProfile (1) ──── (n) Skills
ProfessionalProfile (1) ──── (n) Credentials
ProfessionalProfile (1) ──── (n) Verifications
ProfessionalProfile (1) ──── (n) ReputationEvents
ProfessionalProfile (1) ──── (n) Reviews (from customers)
Review (1) ──── (0..1) ReviewResponse (from professional)
User (n) ──── (n) Categories (via professional_categories)
```

## Migrations

```bash
# Create a new migration file
node scripts/generate-migration.mjs "add_recommendations_table"

# Apply locally
pnpm migrate:local

# Apply to remote (staging/production)
pnpm migrate:remote
```

## Reputation Event Types

| Event Type | Description |
|---|---|
| `verified_job_completed` | A job was confirmed complete by the customer |
| `review_received` | Any review received |
| `five_star_review` | A 5-star review |
| `recommendation_received` | A professional recommendation |
| `repeat_customer` | Customer hired the same professional again |
| `portfolio_project_added` | Project published to portfolio |
| `verification_completed` | Identity/business/credential verified |
| `product_sold` | Product order completed |
| `review_removed` | Admin removed a review (negative signal) |
| `violation_confirmed` | A report confirmed — negative signal |

## Level Requirements

| Level | Name | Verified Jobs | Reviews | Min Rating | Months Active |
|---|---|---|---|---|---|
| 1 | New | 0 | 0 | — | 0 |
| 2 | Established | 5 | 3 | 3.5 | 1 |
| 3 | Trusted | 20 | 15 | 4.0 | 3 |
| 4 | Proven | 50 | 40 | 4.2 | 6 |
| 5 | Master | 100 | 80 | 4.5 | 12 |
| 6 | Legacy | 200 | 150 | 4.7 | 24 |

All requirements must be met simultaneously. Requirements are configurable in `packages/database/src/queries/reputation.ts`.

**Important:** These are platform milestones, not official trade qualifications.

## Indexes

Key indexes for common query patterns:

```sql
-- Profile lookup by slug
idx_pp_slug ON professional_profiles(profile_slug)

-- Search filters
idx_pp_country, idx_pp_level, idx_pp_rating, idx_pp_public

-- Review queries
idx_rev_prof ON reviews(professional_id)
idx_rev_status ON reviews(status)

-- Category browsing
idx_pc_cat ON professional_categories(category_id)

-- Audit trail
idx_al_target ON audit_logs(target_type, target_id)
```

## Account Deletion Policy

Deleting a user account does **not** delete:
- Reviews they received (as a professional)
- Audit logs referencing them
- Dispute records
- Report records

Reviews written by a deleted customer are anonymised (display name → "Former member"). This preserves the integrity of professional reputation records while respecting user data rights.
