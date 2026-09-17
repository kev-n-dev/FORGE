# FORGE Architecture

## Overview

FORGE runs entirely on Cloudflare infrastructure — no always-on servers, no traditional databases, no expensive managed services. This keeps operating cost near zero until traffic justifies paid tiers.

```
Browser / Mobile App
        │
        ▼
  Cloudflare Edge
        │
  ┌─────┴──────┐
  │  WAF       │  Rate Limiting, DDoS protection
  │  Turnstile │  Bot / abuse prevention on forms
  │  CDN       │  Static assets, R2 public media
  └─────┬──────┘
        │
        ▼
  Cloudflare Pages   ← React / Vite frontend (static)
        │
  API calls (fetch)
        │
        ▼
  Cloudflare Workers ← Hono API (apps/worker)
        │
  ┌─────┼──────────────┐
  │     │              │
  ▼     ▼              ▼
  D1   KV             R2
  │     │              │
  SQL  Sessions       Media
       Cache          Verif. docs
```

## Request Flow

1. Browser fetches static frontend from Cloudflare Pages (edge-cached, global CDN)
2. Frontend makes `fetch()` calls to `/api/*`
3. Cloudflare Worker receives the request, validates auth token, dispatches to route handler
4. Route handler reads/writes D1 for relational data
5. KV used for session storage and caching
6. R2 used for uploaded files (images, documents)
7. Queues used for async work (notifications, email, moderation)

## Authentication

- **Registration/Login**: Turnstile CAPTCHA → password verification (PBKDF2-SHA256, 310k iterations) → JWT access token (15 min) + refresh token (7 days)
- **Tokens**: Signed with `AUTH_SECRET` using HMAC-SHA256 via Web Crypto API. Zero external dependencies.
- **Sessions**: Stored in KV as `session:<uuid>` with refresh token hash. Rotation on every refresh. Token theft detection via rotation violation detection.
- **Access tokens**: Stored in memory only (never localStorage). Refresh tokens in sessionStorage.

## Database

Cloudflare D1 is SQLite at the edge. All tables use:
- `TEXT` UUIDs for primary keys (generated with `crypto.randomUUID()`)
- `TEXT` ISO 8601 timestamps
- `INTEGER` for booleans (0/1)
- `TEXT` JSON blobs for complex structured data (audit state snapshots, line items)

See [DATABASE.md](DATABASE.md) for the full schema.

## Reputation System

The reputation system stores **events**, not just a level number:

```
ReputationEvent (professional_id, event_type, source_id, value, description)
    │
    ▼
recalculateReputationLevel()
    │
    ▼
professional_profiles.reputation_level (cached)
```

Level is derived from multi-signal requirements (verified jobs + reviews + rating + time). This means:
- The level is always auditable — you can see every event that contributed
- If requirements change, levels can be recalculated from the event log
- No "XP farming" — requirements use counts and thresholds, not additive scores

## Review Integrity

Reviews are **append-only from the professional's perspective**:

```
Customer submits → active (48h edit window) → locked
                                    │
                          Admin can remove (creates audit log)
                          Professional can respond (one response, can update)
                          Professional can report
```

Professionals **cannot** delete, edit, hide, or suppress reviews. Only admins can remove them, and every removal creates an immutable audit log entry.

## File Upload Security

All uploads are treated as untrusted:

1. MIME type validated server-side (not just file extension)
2. File size limits enforced per category
3. Files stored in R2 with sanitised, random object keys
4. Verification documents stored in a **private** R2 bucket — never publicly accessible
5. Public media served via CDN URL; no direct S3-style presigned URLs exposed to end users

## Feature Flags

Feature flags are stored in D1 and fetched at request time (cached in KV for 60s). The frontend fetches them from `/api/config` on load. Flags control entire feature areas:

```
MARKETPLACE_ENABLED, JOBS_ENABLED, MESSAGING_ENABLED, ...
```

This allows zero-downtime rollout of new phases.

## RBAC

```
CustomerPermissions ⊂ ProfessionalPermissions ⊂ AdminPermissions ⊂ SuperAdminPermissions
```

All authorization is enforced server-side in the Worker. Frontend role checks are for UX only and are never trusted for security decisions.

## Cost Design

| Resource | Cost Model |
|---|---|
| Cloudflare Workers | 100k free requests/day, then $0.50/million |
| Cloudflare D1 | 5M free reads/day, 100k free writes/day |
| Cloudflare KV | 100k free reads/day |
| Cloudflare R2 | 10GB free storage, $0.015/GB/month |
| Cloudflare Pages | Free (unlimited static requests) |
| GitHub Actions | Free for public repos |

Target: **$0/month until meaningful traffic**.

## Scalability

The architecture scales horizontally by default — Workers are stateless, D1 is replicated globally, KV is eventually consistent at the edge. When D1 write throughput becomes a constraint (hundreds of writes/second), the migration path is:
1. Cloudflare Hyperdrive + PlanetScale or Neon (PostgreSQL)
2. Queue-based write buffering for high-volume events (e.g. analytics)
