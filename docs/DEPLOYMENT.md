# The Guild Deployment Guide

## Prerequisites

- Cloudflare account (free tier sufficient to start)
- GitHub repository with Actions enabled
- Wrangler CLI: `pnpm add -g wrangler`
- Authenticated: `wrangler login`

---

## First-Time Setup

### 1. Create Cloudflare Resources

```bash
# Create D1 databases
wrangler d1 create the-guild-db
wrangler d1 create the-guild-db-staging

# Create KV namespaces
wrangler kv:namespace create SESSION_KV
wrangler kv:namespace create SESSION_KV --preview
wrangler kv:namespace create CACHE_KV
wrangler kv:namespace create CACHE_KV --preview

# Create R2 buckets
wrangler r2 bucket create the-guild-media
wrangler r2 bucket create forge-private
wrangler r2 bucket create the-guild-media-staging
wrangler r2 bucket create forge-private-staging

# Create Queues
wrangler queues create forge-notifications
wrangler queues create forge-moderation
wrangler queues create forge-notifications-dlq
```

### 2. Update wrangler.toml

Replace all `REPLACE_WITH_*` placeholders with the IDs returned above.

### 3. Run Migrations

```bash
# Local
pnpm migrate:local

# Remote (staging)
wrangler d1 migrations apply the-guild-db-staging --env staging --remote

# Remote (production)
wrangler d1 migrations apply the-guild-db --env production --remote
```

### 4. Set Secrets

```bash
# Set for each environment (development / staging / production)

wrangler secret put AUTH_SECRET --env staging
# Enter: <32+ char random string: openssl rand -base64 32>

wrangler secret put TURNSTILE_SECRET --env staging
# Enter: your Cloudflare Turnstile secret key

wrangler secret put AUTH_SECRET --env production
wrangler secret put TURNSTILE_SECRET --env production
```

### 5. Create Cloudflare Pages Project

```bash
# Build the web app
pnpm --filter @forge/web run build

# Deploy to Pages (creates the project on first run)
wrangler pages deploy apps/web/dist --project-name=the-guild-web
```

### 6. Configure Turnstile

1. Go to: Cloudflare Dashboard → Turnstile → Add Site
2. Create two widgets: one for staging, one for production
3. Copy the **Site Key** → set as `VITE_TURNSTILE_SITE_KEY` in your build environment
4. Copy the **Secret Key** → set as `TURNSTILE_SECRET` Worker secret

---

## GitHub Actions Setup

Add these secrets to your GitHub repository (Settings → Secrets → Actions):

| Secret | Description |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Workers, D1, KV, R2, Pages permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare Account ID |
| `VITE_TURNSTILE_SITE_KEY` | Turnstile site key for production build |

### Required API Token Permissions

Create at: Cloudflare Dashboard → My Profile → API Tokens → Create Token

Permissions:
- Workers Scripts: Edit
- Workers KV Storage: Edit
- Workers D1: Edit
- Cloudflare Pages: Edit
- Account Settings: Read

---

## Deployment Branches

| Branch | Environment | Trigger |
|---|---|---|
| `develop` | Staging | Push to `develop` |
| `main` | Production | Push to `main` |
| Any | Manual | `workflow_dispatch` |

---

## Rollback

```bash
# List recent Worker deployments
wrangler deployments list

# Roll back to a specific deployment
wrangler rollback <deployment-id>
```

---

## Custom Domain

1. Cloudflare Dashboard → Workers & Pages → the-guild → Settings → Triggers
2. Add custom domain: `theguild.example.com`
3. For Pages: Dashboard → Pages → the-guild-web → Custom Domains

---

## R2 Public Access

Configure public access for the media bucket:

1. Dashboard → R2 → the-guild-media → Settings → Public Access
2. Enable public URL
3. Set `MEDIA_BASE_URL` in `wrangler.toml` to match

Verification documents in `forge-private` must **never** have public access enabled.

---

## Monitoring

Cloudflare provides:
- Worker analytics: requests, errors, latency (Dashboard → Workers → the-guild → Metrics)
- D1 analytics: queries, reads, writes
- Logpush to R2 for persistent log storage (configure when needed)

For error tracking, consider adding Cloudflare Workers observability or a lightweight error sink.

---

## Environment Variables Summary

### Worker (set via `wrangler secret put`)
| Variable | Description |
|---|---|
| `AUTH_SECRET` | JWT signing secret (32+ chars) |
| `TURNSTILE_SECRET` | Cloudflare Turnstile secret key |

### Worker `[vars]` in wrangler.toml (non-secret)
| Variable | Description |
|---|---|
| `ENVIRONMENT` | `development` / `staging` / `production` |
| `MEDIA_BASE_URL` | Public URL prefix for R2 media |
| `TURNSTILE_SITE_KEY` | Public Turnstile site key |

### Web App (`VITE_*` in build environment)
| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | API base URL (default: `/api`) |
| `VITE_TURNSTILE_SITE_KEY` | Turnstile site key for frontend widget |
| `VITE_ENVIRONMENT` | Environment name |
