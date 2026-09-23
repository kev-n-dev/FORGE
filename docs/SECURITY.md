# The Guild Security

## Reporting Vulnerabilities

Email: security@theguild.example.com  
Please do **not** open public GitHub issues for security vulnerabilities.

We aim to acknowledge reports within 48 hours and resolve critical issues within 7 days.

---

## Authentication

### Passwords
- Hashed with **PBKDF2-SHA256** at 310,000 iterations (NIST 2024 minimum)
- Random 16-byte salt per password
- Implemented using the Web Crypto API — no external libraries
- Automatic rehashing on next login if iteration count has been upgraded
- Hash format: `pbkdf2:sha-256:<iterations>:<salt_b64>:<hash_b64>`

### Tokens
- Access tokens: **JWT HS256**, 15-minute TTL
- Refresh tokens: **JWT HS256**, 7-day TTL, stored hashed in KV
- Tokens signed with `AUTH_SECRET` (min 32 chars, generated with `openssl rand -base64 32`)
- **Refresh token rotation**: new refresh token issued on every refresh; old token invalidated
- **Theft detection**: if a previously-used refresh token is replayed, the session is immediately invalidated

### Session Storage
- Access tokens: **memory only** (never localStorage, mitigates XSS)
- Refresh tokens: **sessionStorage** (cleared on tab/browser close)
- Server-side session metadata: **Cloudflare KV** with TTL

### CAPTCHA
- Cloudflare **Turnstile** on all user-facing forms (register, login, reviews, reports)
- Server-side verification — never trust client-side result

---

## Authorization

- RBAC enforced **server-side** in every route handler
- Frontend role checks are UX-only, never security decisions
- Resource ownership verified before mutations (`assertOwnerOrAdmin`)
- Admin routes require both valid auth token **and** admin role
- Audit log required for all sensitive admin actions

---

## Input Validation

- All request bodies validated with **Zod schemas** before any database operation
- Schemas shared between frontend and API (`packages/validation`)
- Client-side validation: UX improvement only
- Server-side validation: security enforcement — **never skipped**

---

## API Security

- **CORS**: Allow-list of origins — `theguild.example.com` only in production
- **Security headers** on every response:
  - `Content-Security-Policy`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- **Rate limiting** by IP per category (auth: 10/min, API: 100/min, reviews: 5/5min)
- **SQL injection**: All queries use parameterised D1 prepared statements

---

## File Upload Security

1. MIME type validated server-side against allowlist per category
2. File size limits enforced (5–20MB depending on type)
3. Filename sanitised (path traversal characters stripped)
4. Random UUID-based R2 object keys (prevents enumeration)
5. Verification documents stored in **private** R2 bucket with no public URL
6. Images processed/resized before storage (strips EXIF metadata where applicable)

---

## Review Integrity

This is a core security concern — fake or manipulated reviews corrupt the platform's value.

- Professionals **cannot** delete, edit, hide, or suppress customer reviews
- Edit window: 48 hours after submission, customer-only
- After edit window: reviews locked, only admin removal possible
- Every admin removal creates an immutable audit log entry
- AI/automated flagging of suspicious review patterns for human review

---

## Audit Logging

Every sensitive admin action is logged:

```json
{
  "id": "uuid",
  "admin_id": "uuid",
  "action": "remove_review",
  "target_type": "review",
  "target_id": "uuid",
  "reason": "Confirmed fraudulent review — same IP as 4 other suspicious accounts",
  "previous_state": { "status": "active", "body": "..." },
  "new_state": null,
  "created_at": "2026-09-15T14:23:00Z"
}
```

Audit logs are **append-only** — no UPDATE or DELETE on `audit_logs` table through the application interface.

---

## Secrets Management

- Secrets stored as **Cloudflare Worker secrets** (`wrangler secret put`)
- Never committed to Git
- Never logged or included in error responses
- `.env` and `.dev.vars` are in `.gitignore`
- CI uses GitHub Actions secrets, referenced by name in workflow files

---

## Advertising Integrity

Advertising **cannot** affect:
- User ratings or review scores
- Verification status
- Reputation level
- Safety decisions
- Search evidence

Sponsored listings are always marked with a `Sponsored` label. This is enforced at the data model level — the `isSponsored` flag on search results is separate from all reputation data.

---

## Known Limitations (Phase 1)

- No email delivery yet (verification links returned in API response in dev mode)
- No push notifications yet
- No automated malware scanning on uploads (planned for Phase 5)
- Rate limiting uses KV-based counters; for high traffic, migrate to Cloudflare Rate Limiting API
- MFA only planned for admin accounts in Phase 5
