# AGENT.md — genug-da

Persistent agent and workflow rules for this repository.

## Ground Rules

- No automatic staging/committing.
- Ideal state: changes are cleanly tested and type-checked before merging.

## Project Overview

**genug-da** is a YNAB-style budget app built on SvelteKit + Svelte 5 (runes mode). Data lives in SQLite (better-sqlite3), mapped via Drizzle ORM. Styling with Tailwind CSS v4.

## Key Files (Source of Truth)

- `src/lib/server/db/` — database access, schema, auth, and domain logic.
  - `tables/` — table definitions, including in-source tests.
  - New domain logic: `budget.ts`, `account.ts`, `category.ts`, `transaction.ts`, `user.ts`.
  - Helpers: `*.utils.ts` (e.g. `budget.utils.ts` for `userHasRole`), `index.ts` exports `actions.<entity>`.
  - `auth.ts` and `auth.utils.ts` — session-based auth, Argon2 hashing.
- `src/lib/remote-functions/*.remote.ts` — server remote functions (Valibot, query/form). `requireUser()` from `remote.utils.ts` handles auth.
- `src/lib/schemas/*.ts` — Valibot validation schemas.
- `src/routes/` — SvelteKit routes, pages, layouts, and server handlers.
- `src/lib/components/*.svelte` — UI components.
- `messages/de.json` and `messages/en.json` — Paraglide i18n messages.
- `docs/*.md` — architecture, database, auth, forms, and routing documentation.

## Important Conventions

- Monetary amounts are stored as integers (cents).
- Budget months as `YYYYMM` integers.
- Components fetch their own data via remote functions — they do not receive data as props from the page server.
- Legacy routes: Zod4 + Superforms + `withPermissions(async (_user, actions, event) => ...)`.
- New code: Valibot + remote functions (`query`, `form`).
- Tests: Vitest. In-source tests via `if (import.meta.vitest) { ... }`. Component tests with `@testing-library/svelte` (jsdom).
- Path aliases in `$lib`: `$db` → `src/lib/server/db`, `$server` → `src/lib/server`.
- Remote function forms: numeric fields prefixed `n:<field>` are auto-coerced to `number` by SvelteKit; custom values via `field.as('number').name` and binding with `InputCurrency`.
- `$props.id()` for unique form IDs; `$derived(await ...)` is allowed outside class bodies.
- Currency type is `(typeof CURRENCIES)[number]` from `$lib/utils/currencies`.
- Icons via `unplugin-icons` (Phosphor) as `import IconName from '~icons/ph/icon-name'`.
- UI primitives: `bits-ui`, drag-and-drop via `sortablejs`.

## Pre-Release Checks

- `npm run check`
- `npm run lint` or `npm run lint:fix`
- Tests: `npm run test:unit` or a single test file via `npx vitest run <path>`
