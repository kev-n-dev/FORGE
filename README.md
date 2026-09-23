# The Guild

**The professional network for people who make, build and create.**

> Build your reputation. Build relationships. Build a business.

The Guild is a professional network, portfolio platform, reputation system, and job marketplace for skilled tradespeople, craftspeople, and makers.

---

## What is The Guild?

The Guild helps professionals who make, build, repair, create, and sell to:

- Build a public professional identity
- Showcase their work through a verified portfolio
- Find work and customers
- Build genuine reputation through verified jobs and honest reviews
- Network with other professionals

The Guild helps customers to:

- Discover skilled professionals through transparent evidence
- View verified work history, genuine reviews, and credentials
- Contact, hire, and review professionals

**Core principle:** The Guild never secretly decides who is "best." It exposes evidence — verified jobs, ratings, reviews, credentials — and lets customers decide.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, TanStack Router, TanStack Query |
| API | Cloudflare Workers, Hono |
| Database | Cloudflare D1 (SQLite) |
| Storage | Cloudflare R2 |
| Sessions | Cloudflare KV |
| Queues | Cloudflare Queues |
| Auth | Web Crypto API (PBKDF2 + JWT HS256) — zero external dependencies |
| Validation | Zod |
| Testing | Vitest, Playwright |
| CI/CD | GitHub Actions |
| CDN / Security | Cloudflare WAF, Rate Limiting, Turnstile |

---

## Monorepo Structure

```
forge/
├── apps/
│   ├── web/          React + Vite frontend
│   └── worker/       Cloudflare Workers API (Hono)
│
├── packages/
│   ├── types/        Shared TypeScript types
│   ├── validation/   Zod schemas (shared between API and frontend)
│   ├── database/     D1 query helpers and migrations
│   ├── auth/         Auth utilities (password, JWT, sessions, RBAC)
│   ├── config/       Feature flags, platform constants, upload config
│   └── ui/           (reserved for shared component library)
│
├── migrations/       D1 SQL migrations
├── scripts/          Dev utilities and seed scripts
├── tests/e2e/        Playwright end-to-end tests
├── docs/             Architecture and design documentation
└── .github/          CI/CD workflows
```

---

## Local Development

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9 — `npm install -g pnpm`
- Wrangler CLI — `pnpm add -g wrangler`
- A Cloudflare account (free tier is sufficient)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/forge.git
cd forge

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env
cp apps/worker/.dev.vars.example apps/worker/.dev.vars
# Edit both files and fill in your values

# 4. Create local D1 database and run migrations
pnpm migrate:local

# 5. Seed development data
pnpm seed:local

# 6. Start the Worker API (terminal 1)
pnpm --filter @forge/worker run dev

# 7. Start the web app (terminal 2)
pnpm --filter @forge/web run dev
```

The frontend will be at `http://localhost:5173`.
The API will be at `http://localhost:8787`.

---

## Scripts

| Command | Description |
|---|---|
| `pnpm install` | Install all dependencies |
| `pnpm dev` | Start all apps in dev mode (parallel) |
| `pnpm build` | Build all apps |
| `pnpm test` | Run all unit tests |
| `pnpm test:e2e` | Run Playwright E2E tests |
| `pnpm typecheck` | TypeScript check across all packages |
| `pnpm lint` | ESLint all packages |
| `pnpm format` | Prettier format all files |
| `pnpm migrate:local` | Apply D1 migrations locally |
| `pnpm migrate:remote` | Apply D1 migrations to remote (requires auth) |
| `pnpm seed:local` | Seed local D1 with development data |

---

## Deployment

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for full deployment instructions.

**Quick deploy:**

```bash
# Deploy to staging
git push origin develop

# Deploy to production
git push origin main
```

Deployment requires GitHub secrets:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `VITE_TURNSTILE_SITE_KEY`

Worker secrets (set via `wrangler secret put`):
- `AUTH_SECRET`
- `TURNSTILE_SECRET`

---

## Phase Roadmap

| Phase | Status | Features |
|---|---|---|
| 1 — Foundation | 🚧 In progress | Auth, profiles, portfolio, search, reviews, reputation, admin |
| 2 — Jobs | Planned | Job board, messaging, quotes, job lifecycle |
| 3 — Marketplace | Planned | Products, orders, custom requests |
| 4 — Network | Planned | Feed, connections, recommendations, mentorship |
| 5 — Trust | Planned | Advanced verification, fraud detection, disputes |
| 6 — Monetisation | Planned | Advertising (transparent, non-manipulative) |
| 7 — Commerce | Planned | Payments, deposits, contracts |

---

## Important Product Rules

These are **non-negotiable** and enforced throughout the codebase:

1. Professionals cannot delete customer reviews
2. Advertising cannot buy reputation, ratings, or verification
3. Platform level is not an official trade qualification
4. The Guild never guarantees the quality of any professional's work
5. Verification describes what was verified, not quality
6. Admin review removals require an audit log entry with reason
7. Sensitive personal information (addresses, documents) is never publicly exposed
8. Sponsored listings are always clearly labelled

---

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md).

## Security

See [SECURITY.md](docs/SECURITY.md). To report a vulnerability, email security@theguild.example.com.

## License

MIT — see LICENSE.
# The Guild
# The Guild
