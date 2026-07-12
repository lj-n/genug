# ADR-0006: Route params feeding remote queries are read through a latched accessor

Date: 2026-07-12
Status: accepted

## Context

During client-side navigation _away_ from the budget/account subtree,
SvelteKit's `params` transiently reflects the target route while the old page
is still mounted. An id feeding a still-live top-level
`$derived(await getX(...))` (see ADR-0003) briefly becomes `undefined`, the
query runs with that arg, the bare `v.string()` / object schemas reject it, and
the server logs `Remote function schema validation failed` and returns 400. It
is timing-dependent — it surfaces on slow CI runners, not locally (#15).

The same id was read three inconsistent ways across the subtree:

- the budget-id context getter (`getBudgetId` / `setBudgetId`),
- raw `params.budgetId` / `params.accountId` via `PageProps`,
- `page.params.budgetId!` via `$app/state` with non-null assertions.

The `!` assertions were papering over exactly this transient `undefined`. The
month page already documented the teardown behavior and dodged it for `month`
via `parseMonth` (which returns `null` for the transient value, gating
month-dependent UI) — but nothing gated the ids.

Alternatives considered:

- **`handleValidationError` logging hook.** Only surfaces the symptom; the
  query still fires with `undefined`. Out of scope here; file separately if a
  safety net is wanted.
- **Non-null assertions everywhere.** The status quo. Lies to the type system
  and does nothing at runtime — the value really is `undefined` mid-teardown.
- **Guard each call site** (`{#if id}` / early return per query). Repetitive,
  easy to forget on the next query, and pushes teardown-awareness into every
  consumer.

## Decision

**One canonical way to read a route param that feeds a query: a latched
("sticky") accessor.** `stickyParam(get: () => T | undefined): () => T` in
`$lib/utils/sticky-param` wraps a reactive getter, caches the last non-nullish
value, and returns the cached value while the source is currently nullish.
Reading it inside a reactive scope still tracks the source, so consumers re-run
when the param genuinely changes.

- The budget-id context provider latches through `stickyParam`; the consumer
  contract stays `() => string`, so every `getBudgetId()` consumer is fixed at
  the single provider seam.
- The account-detail page reads `accountId` through `stickyParam` and
  `budgetId` through the (now latched) context.
- The three prior read patterns collapse to this one for query args; the `!`
  assertions on `page.params` disappear for those reads.

This is orthogonal to ADR-0003: the awaited-top-level _consumption_ pattern is
unchanged — only the argument _source_ is latched.

## Consequences

- No remote query (`getBudget`, `getAccount`, `getAccountBalances`,
  `getBudgetUsers`, `getUnassigned`, `getArchivedCategories`, `getMonthly`,
  `listTransactions`) can be invoked with an `undefined` id during navigation
  away from the subtree; the 400 + validation-error log class is removed
  structurally rather than logged.
- `stickyParam` is a pure, deterministically unit-tested helper — no reactive
  framework mock needed.
- Pure non-query uses of route params (navigation hrefs, hidden form fields)
  are left as-is; they fire on user interaction when `params` is defined, and
  latching them would drill props for no benefit.
- One accessor to learn and review; a new budget-scoped query is safe by
  construction as long as its id comes from the context or `stickyParam`.
