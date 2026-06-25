# Database and Server-Domain Conventions

- `src/lib/server/db/index.ts` is the shared database entry point.
- `DATABASE_URL` is required during normal app execution. No silent fallback paths.
- Reuse `createDatabase()` for tests and isolated database setup.
- Table definitions are declarative, grouped by domain under `src/lib/server/db/tables`.
- Reuse shared helpers like `createId()` and existing utility constants instead of duplicating them.
- Prefer real database constraints and indexes for invariants when possible.
- Keep `tables`, `relations.ts`, and generated migrations in sync.
- Generate schema migrations through the existing Drizzle workflow instead of hand-writing SQL migration files.
- Auth primitives belong in `src/lib/server/db/auth`. Reuse existing session, password, and cookie helpers.
- Keep credential errors generic and propagate auth failures explicitly.
- Business rules belong in `src/lib/server/db/user-context`.
- Access control must be enforced in `user-context` with `hasAccess`, `accessGuard`, and `ownerGuard`, not only in routes.
- Preserve the existing `queries(...)` and `commands(...)` split in `user-context` modules.
- Keep domain SQL close to the feature it supports, including budget aggregates and transaction calculations.
- Preserve request-id logging and explicit error handling patterns from `hooks.server.ts` and server helpers.
