# genug-da — Agent Instructions

Persistent agent and workflow rules for this repository.

## Ground Rules

- Match existing code conventions. No drive-by refactors, renames, or reformatting.
- Verify with real tool output — never fabricate file contents, API responses, or test results.
- Keep codebase files in English.

## Stack

SvelteKit 2 + Svelte 5 runes, `@sveltejs/adapter-node`, Tailwind 4, Drizzle ORM on `better-sqlite3`, Paraglide i18n, SvelteKit experimental remote functions.

## Build, Test, and Lint Commands

Set `DATABASE_URL` for builds and DB-backed tests. For local runs, `:memory:` is the common value.

```bash
# development
DATABASE_URL=:memory: npm run dev

# type/svelte checks
npm run check

# linting and formatting
npm run lint
npm run lint:fix
npm run format

# production build / preview
DATABASE_URL=:memory: npm run build
DATABASE_URL=:memory: npm run preview

# unit tests
DATABASE_URL=:memory: npm run test:unit
DATABASE_URL=:memory: npm run test:unit -- src/lib/server/db/auth/auth.test.ts
DATABASE_URL=:memory: npm run test:unit -- src/lib/server/db/auth/auth.test.ts -t "authenticateUser - returns user on valid credentials"

# Playwright
npm run test:e2e
npm run test:e2e -- tests/playwright/account.spec.ts
npm run test:e2e -- tests/playwright/account.spec.ts -g "Create Account"
npm run test:e2e:ui
```

## Architecture

- **Request pipeline:** `src/hooks.server.ts` — logging → session auth → Paraglide locale. Populates `event.locals.logger`, `event.locals.session`, `event.locals.user`.
- **Routing:** authenticated screens under `src/routes/(app)`. App root redirects logged-in users to first budget + current month. Budget-scoped routes under matcher-based `[budgetId=id]` and `[month=month]`.
- **Data layer:** `src/lib/server/db/index.ts` exports the shared Drizzle database. `createDatabase()` runs migrations at startup from `src/lib/server/db/migrations`. Table definitions in `src/lib/server/db/tables`, relations in `relations.ts`.
- **Auth:** session and password logic in `src/lib/server/db/auth`. Budget/account/category/transaction operations in `src/lib/server/db/user-context`, created via `createUserCtx(userId)`. Access control: `accessGuard()`, `ownerGuard()` — enforced in `user-context`, not only routes.
- **Server/UI boundary:** remote functions in `src/lib/remote-functions/*.remote.ts` over ad-hoc API endpoints. Use `guardedQuery`, `guardedForm`, `guardedCommand` from `src/lib/server/utils/remote-guard.ts`.
- **Testing:** unit/component tests beside source (`src/**/*.{test,spec}.ts`). DB tests use isolated `:memory:` databases or helpers from `src/test/fixtures.ts`. E2E tests in `tests/playwright` with page-object layer in `tests/playwright/pom` and serial `setup` project in `tests/playwright/global.setup.ts`.

## Key Conventions

- **i18n:** Import `m` from `$lib/paraglide/messages`. Translation sources in `messages/*.json`. Run `npx paraglide-js compile --project ./project.inlang --outdir ./src/lib/paraglide` after editing messages.
- **Remote functions first.** Pages import remote functions directly (`foo.enhance(...)`, `await getBudget(...)`). Extend `*.remote.ts` before reaching for `+server.ts`.
- **Business rules in `user-context`.** Route files and remote functions stay thin. Authorization, query logic, persistence rules belong in `src/lib/server/db/user-context`.
- **Icons:** Prefer `<Name>Icon` imports. Older `Ph*` icon imports exist but new/touched code uses `<Name>Icon`.
- **Unused values:** `_` prefixes for intentionally unused args, variables, caught errors (ESLint configured).
- **DB tests:** Fresh `createDatabase(':memory:')`, seed only what's needed, reuse `src/test/fixtures.ts`.

## Path-Specific Documentation

Detailed conventions per domain live in `docs/`:

- `docs/code-style.md` — code-level style rules (runes, TypeScript, naming, errors/comments)
- `docs/routes.md` — `src/routes/**`
- `docs/remote-functions.md` — `src/lib/remote-functions/**`
- `docs/database.md` — `src/lib/server/db/**` and server helpers
- `docs/components.md` — `src/lib/components/**`
- `docs/schemas.md` — `src/lib/schemas/**`
- `docs/tests.md` — unit and Playwright tests

When a domain-specific doc applies, follow both it and this file.

## Agent Skills

### Issue tracker

Issues live in GitHub Issues; external PRs are not a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
