# ADR-0003: Remote query data is awaited at component top level

Date: 2026-07-11
Status: accepted

## Context

Components consume remote queries via top-level
`const x = $derived(await getX(...))`. In dev this produces ~28
`await_waterfall` warnings per app load (#35). Empirical analysis showed the
warning does not primarily flag sequential requests: Svelte emits it whenever
an awaited derived resolves and its value is not read promptly — here, mostly
values whose only read site is conditionally rendered UI (closed dialogs and
popovers, the desktop-hidden mobile navigation).

An attempt to drive the warning count to zero (the first version of this ADR)
adopted a read-site doctrine: query objects at script top level, `await` at
the place in markup where the value is read. It worked — 0 warnings — but the
resulting developer experience was unacceptable and the doctrine was reverted
before merge.

Alternatives considered:

- **Await where you read** (query objects at top level, `await` inline in
  markup or via `{@const x = await q}` in snippets). Rejected after full
  migration: the rule is not mechanical. Every read requires reasoning about
  render conditions and refresh topology (three branches: unconditional reads
  stay top-level; conditional reads await in markup; markup re-rendered by
  `.updates(...)` refreshes must never contain `await` — the pending async
  fork breaks the single-flight submit round-trip, verified by e2e). Templates
  filled with `(await q).field` noise, and props got drilled just to avoid
  awkward local queries.
- **Split pattern only** (the fix suggested by Svelte's `await_waterfall`
  docs). Falsified by prototype: values read conditionally kept warning.
- **`Promise.all` around independent queries.** Rejected: `Promise.resolve`
  wraps the query thenables in a microtask, so per-query refresh tracking is
  not reliably preserved, and one query refreshing re-runs the combined
  derived for both.
- **`query.current` everywhere.** Works by construction but forces every
  consumer to handle `undefined`; far larger migration for no benefit.
- **Route-level `<svelte:boundary>` pending UI.** Deferred: a layout-level
  boundary broke re-rendering after single-flight form refreshes (stale
  settings form, red Playwright).

## Decision

**One pattern: `const x = $derived(await getX(...))` at script top level.**
No `await` in markup, no `{@const x = await q}`. Uniformity and a mechanical
rule outweigh the dev-mode warning count.

The `await_waterfall` warnings this produces are explicitly accepted: the
heuristic largely flags reads in closed UI, queries are local sqlite reads
costing microseconds, and the eager fetches are almost always cache hits on
data the visible page already holds. The Svelte team is still iterating on
the heuristic.

Where an eager fetch is genuinely wasteful, fix it structurally, not with a
second await pattern: move the fetch into a component that only mounts when
the UI is shown (e.g. dialog content). The criterion is **sole consumer** —
extract only when the conditionally mounted UI is the only consumer of that
query on the page. As of this decision no component meets it (every
overlay-fetched query is also read by always-visible UI, so eager awaits are
cache hits).

## Consequences

- Exactly one consumption pattern to learn, review, and generate; no
  per-read-site reasoning.
- The single-flight interaction is safe by construction: top-level awaited
  deriveds are the case that never broke it.
- Dev consoles show `await_waterfall` warnings; a warning on this pattern is
  not a defect to chase. Sequential requests from genuinely dependent chains
  (category detail → stats) also stay as they are — that order is semantic.
- Deferral is a component-boundary decision, applied via the sole-consumer
  criterion when a case appears.
