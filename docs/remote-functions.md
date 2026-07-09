# Remote Function Conventions

## Server side (adapters)

- Remote functions are the default mutation and query layer. Before adding `+server.ts`, check whether the feature belongs in `src/lib/remote-functions/*.remote.ts`.
- Group functions by domain: `budget.remote.ts`, `account.remote.ts`, `transaction.remote.ts`, etc.
- Use `guardedQuery`, `guardedForm`, and `guardedCommand` for authenticated work instead of rebuilding login handling.
- Remote functions are **mechanical adapters** (see ADR-0002). They may: guard auth, validate input, translate form semantics to DB semantics (missing field vs. cleared field), redirect, and refresh query caches. Nothing else.
- Litmus test: **if a remote function produces a value instead of passing one through or translating it, that value belongs in `user-context`.** Defaults, normalization rules, and eligibility checks are business rules — put them in `src/lib/server/db/user-context` or `src/lib/server/db/auth`.
- Server load functions are peer adapters, not bypasses: they may call `createUserCtx()` directly, but must check `locals.session` themselves.
- The adapter layer is deliberately test-free. Tests target `user-context`; Playwright covers the wiring. If an adapter seems to need a unit test, it holds logic that should move down.
- Reuse existing remote form ergonomics: `.enhance(...)`, `.for(...)`, `.fields.*`, `.issues()`, `.allIssues()`.
- Keep user-facing text localized through Paraglide message helpers.

## Declaring queries: `query` vs `query.batch`

- Entity-by-id queries that are (or plausibly become) instantiated by several
  sibling components at once — per-row, per-item — are declared with
  `query.batch` via `guardedBatchQuery`: `getCategoryById`, `getCategoryStats`,
  `getCategoryArchivability`, `getAccountBalances`.
- The criterion for new queries: **same query, different args, multiple
  simultaneous callers ⇒ batch.** Page-scoped queries called with one shared
  arg (`getBudget`, `getMonthly`, list queries) stay plain `query` — the
  client cache already dedupes identical calls.
- Batch resolvers map over the args array through `ctx.*` calls; per-item
  access control stays in user-context (ADR-0002 unchanged).

## Client side (consuming queries)

The canonical rule is **await where you read** (ADR-0003):

- Create query objects at script top level: `const q = getX()` for static
  args, `const q = $derived(getX(arg))` for reactive args. Creating a query
  does not fetch; the first `await`/read does.
- `await` the query at its read site:
  - `const x = $derived(await q)` at top level when the value is read
    unconditionally in always-rendered markup.
  - Values that only feed conditionally rendered UI (dialog, popover,
    drawer content, `{#if}` branches) are awaited inside that markup —
    template expressions or `{@const x = await q}` at the top of the
    content snippet. Deferred UI then fetches on open, deduped by the cache.
  - **Never `await` inside markup that re-renders on query refreshes**,
    e.g. per-row cells of a list that a form refreshes via `.updates(...)`.
    The pending async fork breaks the single-flight submit round-trip
    (verified: it left edit rows stuck open). Such reads are unconditional
    anyway — keep them on a top-level awaited derived.
- Never combine independent queries with `Promise.all` — it can detach the
  derived from per-query refresh tracking and couples unrelated refreshes.
- Dependent chains (`const a = await q1` feeding `q2`) stay sequential; a
  remaining dev warning on a genuinely dependent chain is acceptable.
- Do not destructure awaited queries at top level
  (`const { currency } = $derived(await q)`) — destructuring reads the whole
  value eagerly and hides the real read site.

### Pending and error UI

- **Not adopted yet.** A layout-level `<svelte:boundary>` with a `pending`
  snippet was tried and reverted: it broke re-rendering after single-flight
  form refreshes (settings form kept stale values, Playwright red). Until a
  per-route pattern is verified against the e2e suite, pages keep the
  default blocking behavior and no component adds its own boundary.
- `query.current` + `.loading`/`.error` remains the tool for a component
  that genuinely needs bespoke loading UI.

### Mutations and cache refresh

- Default: single-flight refresh via `await form.submit().updates(query, ...)`.
- Optimistic updates (`.updates(query.withOverride(...))`) are opt-in for
  hot paths only: rapid repeated interactions where the round-trip is felt
  (assigning money to categories, toggling transaction validation). Anything
  else stays single-flight.
