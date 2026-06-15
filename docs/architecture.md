# Architecture

genug-da is a YNAB-style personal finance app. Stack: SvelteKit 2 + Svelte 5 (runes mode), SQLite via `better-sqlite3`, Drizzle ORM, Tailwind CSS v4, TypeScript, Valibot, Paraglide i18n.

## Path aliases

| Alias     | Resolves to         |
| --------- | ------------------- |
| `$lib`    | `src/lib`           |
| `$server` | `src/lib/server`    |
| `$db`     | `src/lib/server/db` |

## Data conventions

- Monetary amounts are stored as **integers (cents)**. Never floats.
- Transaction dates: **`YYYY-MM-DD`** string, enforced by a DB check constraint.
- Budget months: **`YYYYMM`** integer (e.g. `202312`), range 190001–210012, enforced by check constraint.

## Middleware chain (`src/hooks.server.ts`)

Three handles composed with `sequence(handleLogging, handleAuth, handleParaglide)`:

1. **`handleLogging`** — creates a `requestId`, attaches a pino child logger to `event.locals.logger`, logs method/path/status/ms after response.
2. **`handleAuth`** — reads session cookie → `auth.validateSession()` → sets `event.locals.session` (or null). Refreshes cookie on valid session, deletes it on invalid.
3. **`handleParaglide`** — detects locale, delocales URL, replaces `%paraglide.lang%` / `%paraglide.dir%` in the HTML response.

Error handler (`handleError`) logs with a `logId` and returns `{ logId, message }` to the client.

## Global types (`src/app.d.ts`)

```typescript
App.User; // authenticated user (no passwordHash)
App.Session; // { id, expiresAt, user: App.User }
App.Actions; // instance of Actions class
App.Database; // Drizzle SQLite DB type
App.Budget; // inferred from budgets table
App.Locals; // { logger: pino.Logger, session: Session | null }
App.Superforms.Message; // { type: 'success' | 'error', text?: string }
```

## UI conventions

- Svelte 5 runes mode enforced project-wide via `svelte.config.js`.
- Icons: `unplugin-icons` with the Phosphor set — `import <icon-name>Icon from '~icons/ph/icon-name'`.
- UI primitives: `bits-ui`. Currency input: `@canutin/svelte-currency-input`.
- Drag-to-reorder: `sortablejs`.

## Testing

### Unit tests: Vitest

In-source tests via `if (import.meta.vitest) { ... }` — used throughout `src/lib/server/db/tables/` to test schema constraints. Component tests with `@testing-library/svelte` + jsdom.

Run: `npm run test:unit` or `npx vitest run <path>`

### E2E tests: Playwright

Located in `tests/playwright/`. Uses **page object models** (`tests/playwright/pom/`) with viewport-aware navigation (`isDesktop`/`isMobile`/`isTablet`).

Key conventions:

- Serial setup in `global.setup.ts` — creates admin, seeds initial state.
- No `storageState` — each test handles its own auth via helper functions.
- POM classes: `BasePage` (nav, createBudget), `BudgetPage` (goto, createAccount), `AccountPage` (goto, editName).
- Viewport breakpoints: desktop ≥ 1292px, mobile ≤ 767px.

Run: `npx playwright test` or `npx playwright test --ui`

See `docs/playwright.md` for full details.
