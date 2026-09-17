# Contributing to FORGE

## Development Setup

See the [README.md](../README.md) for local development setup.

## Branch Strategy

- `main` — production-ready code, protected branch
- `develop` — integration branch, deploys to staging
- `feat/<description>` — new features
- `fix/<description>` — bug fixes
- `chore/<description>` — maintenance tasks

## Pull Request Process

1. Branch from `develop`
2. Keep PRs focused — one feature or fix per PR
3. PR title must follow Conventional Commits format:
   - `feat: add professional search filters`
   - `fix: correct review edit window calculation`
   - `chore: update wrangler to v3.75`
4. All CI checks must pass before merge
5. At least one review required for `main`
6. Security-sensitive paths require senior review (see CODEOWNERS)

## Code Standards

### TypeScript

- Strict mode always on
- No `any` without justification comment
- Explicit return types on exported functions
- Prefer `type` imports for type-only imports

### Validation

- All user input goes through Zod schemas in `packages/validation`
- Never trust client-supplied data server-side
- Validation schemas are shared between API and frontend

### Database

- All queries use parameterised D1 prepared statements (SQL injection prevention)
- New tables require a migration file in `migrations/`
- Migration naming: `NNNN_description.sql` (e.g. `0002_add_recommendations.sql`)

### Security

- Never log sensitive data (passwords, tokens, verification documents)
- Never expose raw error details to the client in production
- Authorization checks belong in route handlers, not just middleware
- New admin actions must create an audit log entry

## Review Integrity — Never Break These

These rules must be preserved in every PR that touches reviews or reputation:

1. Professionals cannot delete reviews
2. Only admins can remove reviews, and must have an audit record
3. Review removal must update the professional's cached rating
4. Reputation level is derived from events, never manually assigned
5. Advertising cannot modify any reputation, rating, or verification data

## Testing

- Unit tests alongside new logic files (same directory, `__tests__/` folder)
- Integration tests for new API routes in `apps/worker/src/__tests__/`
- E2E tests for critical user flows in `tests/e2e/`
- Run before pushing: `pnpm test && pnpm typecheck`
