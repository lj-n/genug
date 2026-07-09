# ADR-0003: Remote query data is awaited where it is read

Date: 2026-07-09
Status: accepted

## Context

Components consumed remote queries via top-level `const x = $derived(await getX(...))`
(the pattern docs/routes.md used to recommend). In dev this produced ~28
`await_waterfall` warnings per app load (#35). Empirical analysis showed the
warning does not primarily flag sequential requests: Svelte emits it whenever
an awaited derived resolves and its value is not read promptly. Our root cause
was components eagerly awaiting data whose only read site is conditionally
rendered UI — closed dialogs (budget-settings, budget-user-manager), closed
popovers (transfer-popup, instantiated per category row), the desktop-hidden
mobile navigation. Those eager awaits also fetched data nobody looked at.

Alternatives considered:

- **Split pattern only** (query objects in one `$derived`, awaits in separate
  `$derived`s — the fix suggested by Svelte's `await_waterfall` docs).
  Falsified by prototype: values read conditionally kept warning
  (e.g. a destructured `currency` only rendered when `unassigned !== 0`).
- **`Promise.all` around independent queries.** Rejected: `Promise.resolve`
  wraps the query thenables in a microtask, so per-query refresh tracking is
  not reliably preserved, and one query refreshing re-runs the combined
  derived for both.
- **`query.current` everywhere.** Works by construction but forces every
  consumer to handle `undefined` and gives up non-nullable values; far larger
  migration for no additional benefit.

## Decision

**Await where you read.** Query objects are created at script top level
(`const q = getX()` for static args, `const q = $derived(getX(arg))` for
reactive args); the `await` happens at the read site — template expressions,
`{@const}` at the top of dialog/popover/drawer content snippets. Top-level
`const x = $derived(await q)` remains correct only when the value is read
unconditionally in always-rendered markup.

The read-site rule has one hard exception, found by the e2e suite: markup
that re-renders on query refreshes (per-row cells of a list refreshed via
`.updates(...)`) must not contain `await` — the pending async fork breaks the
single-flight submit round-trip. Those reads are unconditional anyway and
stay on top-level awaited deriveds.

Route-level `<svelte:boundary>` pending/failed UI was part of the original
decision but is **deferred**: a layout-level boundary broke re-rendering
after single-flight form refreshes (stale form values, red Playwright).
`query.current` is reserved for components that want their own fine-grained
loading UI.

## Consequences

- Deferred UI (closed overlays) no longer fetches at mount; it fetches on
  open, deduplicated by the query cache — usually a cache hit because the
  visible page already holds the same query.
- Verified in prototype: month-page loads went from 7 `await_waterfall`
  warnings to 0; nothing regressed.
- Dependent chains (e.g. category detail → stats) stay sequential; that
  order is semantic, not accidental.
- A component whose value is read both in always-rendered and deferred
  markup keeps one top-level awaited derived — do not duplicate queries per
  read site; the cache makes extra `await q` reads free.
