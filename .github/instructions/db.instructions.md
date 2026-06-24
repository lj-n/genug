---
applyTo: "src/lib/server/db/**/*.ts,src/lib/server/utils/**/*.ts,src/test/fixtures.ts"
---

# Database and server-domain instructions

- Treat `src/lib/server/db/index.ts` as the shared database entry point.
- `DATABASE_URL` is required during normal app execution. Do not introduce silent fallback paths that bypass it.
- Reuse `createDatabase()` for tests and isolated database setup.
- Keep table definitions declarative and grouped by domain under `src/lib/server/db/tables`.
- Reuse shared helpers like `createId()` and existing utility constants instead of duplicating them.
- Prefer real database constraints and indexes for invariants when possible.
- Keep `tables`, `relations.ts`, and generated migrations in sync when schema changes are intentional.
- Generate schema migrations through the existing Drizzle workflow instead of hand-writing SQL migration files.
- Auth primitives belong in `src/lib/server/db/auth`. Reuse existing session, password, and cookie helpers rather than duplicating crypto or cookie logic.
- Keep credential errors generic and propagate auth failures explicitly.
- Business rules belong in `src/lib/server/db/user-context`.
- Access control must be enforced in `user-context` with helpers such as `hasAccess`, `accessGuard`, and `ownerGuard`, not only in routes.
- Preserve the existing `queries(...)` and `commands(...)` split in `user-context` modules.
- Keep domain SQL close to the feature it supports, including budget aggregates and transaction calculations.
- Preserve the request-id logging and explicit error handling patterns already used in `hooks.server.ts` and server helpers.
