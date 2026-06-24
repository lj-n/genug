# Copilot instructions for `genug-da`

## Build, test, and lint commands

This app imports the shared database module during normal server execution, so set `DATABASE_URL` for builds and DB-backed tests. For local runs, `:memory:` is the common value.

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

# local app for browser-driven MCP sessions
DATABASE_URL=:memory: npm run dev
```

## High-level architecture

- **Stack:** SvelteKit 2 + Svelte 5 runes, `@sveltejs/adapter-node`, Tailwind 4, Drizzle ORM on `better-sqlite3`, Paraglide i18n, and SvelteKit experimental remote functions.
- **Request pipeline:** `src/hooks.server.ts` runs logging first, then session auth, then Paraglide locale handling. It populates `event.locals.logger`, `event.locals.session`, and `event.locals.user`.
- **Routing model:** authenticated screens live under `src/routes/(app)`. The app root redirects logged-in users to their first budget and the current month. Budget-scoped routes are nested under matcher-based paths like `[budgetId=id]` and `[month=month]`.
- **Data layer:** `src/lib/server/db/index.ts` exports the shared Drizzle database. `createDatabase()` runs migrations at startup from `src/lib/server/db/migrations`. Table definitions and relations live under `src/lib/server/db/tables` and `relations.ts`.
- **Auth and access:** session and password logic lives in `src/lib/server/db/auth`. Budget/account/category/transaction operations live in `src/lib/server/db/user-context`, created via `createUserCtx(userId)`. Access control is enforced in that layer with guards like `accessGuard()` and `ownerGuard()`, not only in route files.
- **Server/UI boundary:** this project prefers remote functions in `src/lib/remote-functions/*.remote.ts` over ad-hoc API endpoints. Authenticated remote functions should usually go through `guardedQuery`, `guardedForm`, or `guardedCommand` from `src/lib/server/utils/remote-guard.ts`, which build the per-user context and handle login redirects consistently.
- **Testing layout:** unit/component tests live beside source under `src/**/*.{test,spec}.ts`. DB tests usually create isolated `:memory:` databases directly or through helpers in `src/test/fixtures.ts`. End-to-end tests live in `tests/playwright`, use the page-object layer in `tests/playwright/pom`, and depend on the serial `setup` project in `tests/playwright/global.setup.ts`.
- **Browser automation tooling:** workspace-level Playwright MCP is configured in `.vscode/mcp.json`. Start the app locally with `DATABASE_URL=:memory: npm run dev` before using MCP against the app in development.

## Key conventions

- **Use Paraglide for user-facing text.** Import `m` from `$lib/paraglide/messages` instead of hardcoding copy. Translation source files live in `messages/*.json`; `project.inlang/settings.json` is the i18n project config. Avoid hand-editing generated `src/lib/paraglide/*` output if it is present.
- **Follow the remote-function pattern.** Pages and components often import remote functions directly and use helpers like `foo.enhance(...)` or `await getBudget(...)`. When adding new authenticated mutations/queries, extend the relevant `*.remote.ts` file before reaching for `+server.ts`.
- **Keep business rules in `user-context`.** Route files and remote functions should stay thin; budget/account/category/transaction authorization and query logic belong in `src/lib/server/db/user-context`.
- **Prefer `<Name>Icon` imports in feature code.** Older `Ph*` icon imports exist, but new or touched feature code should use the `<Name>Icon` naming convention.
- **Use `_` prefixes for intentionally unused values.** ESLint is configured to allow `_foo` for unused args, variables, and caught errors.
- **Tests favor colocated source coverage and in-memory DBs.** For DB-heavy unit tests, mirror the existing pattern: create a fresh `createDatabase(':memory:')`, seed only what the test needs, and use helpers from `src/test/fixtures.ts` when they already fit.

## Path-specific instructions

Repository-wide guidance stays in this file. More detailed instructions are split into path-specific files under `.github/instructions`:

- `routes.instructions.md` for `src/routes/**`
- `remote-functions.instructions.md` for `src/lib/remote-functions/**`
- `db.instructions.md` for `src/lib/server/db/**` and related server helpers
- `components.instructions.md` for `src/lib/components/**`
- `schemas.instructions.md` for `src/lib/schemas/**`
- `tests.instructions.md` for unit and Playwright tests

When a relevant path-specific file applies, follow both it and this repository-wide file.
