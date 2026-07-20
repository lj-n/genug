# ADR-0004: Envelope math lives behind one internal seam in user-context

Date: 2026-07-11
Status: accepted

## Context

The envelope invariant — Remaining = Σ assignments + Σ transactions — was
hand-written as paired transaction/assignment aggregate subqueries in three
places (`budget.monthly`, `category.archivability`, `category.stats`), with
`budget.unassigned`'s income − assignments formula as a fourth sibling. The
spellings differ in cutoff (in-month, on-or-before-month, all-time) and the
cutoff semantics were untested — the three copies agreed by care, not by
construction. Any rule change (e.g. excluding archived categories) had to be
found and repeated in every copy.

Four shapes were considered for concentrating the math:

- **Joinable subquery with both column families.** One builder returns a
  Drizzle subquery keyed by category id; all-time columns are always present,
  passing a `Month` adds the month-scoped columns under distinct names.
- **Row-returning functions** (`perCategory(...)`, `forBudget(...)`).
  Deepest interface, but `budget.monthly` must remain a single SQL query
  (per-user ordering plus category columns), which row merging in JS breaks.
- **Exported aggregate fragments** (the tx/assignment subquery builders plus
  expression helpers). Least churn, but formula composition stays at the
  callers — the module remains shallow.
- **A cutoff mode parameter** changing what one `remaining` column means.
  Identical read sites with different meanings is exactly the ambiguity that
  let the three spellings drift apart.

## Decision

An internal module `envelope.ts` in user-context owns all envelope math.

- `categoryBalances(month?)` returns **one joinable subquery** keyed by
  category id. The all-time family (`allTimeRemaining`, `pendingCount`,
  `txCount`, `assignCount`) is always present; passing a `Month` adds the
  month family (`assigned`, `activity`, `remaining` = on-or-before cutoff).
  **Distinct column names per cutoff, no mode parameter** — misuse is visible
  at the read site.
- `unassigned(budgetId)` is a scalar runner for the income − assignments
  formula.
- The module is **not exported** from the user-context index; the public
  interface of user-context is unchanged. Its own test file exercises the
  internal seam directly.
- Access control stays in the outer queries (`hasAccess` joins); the envelope
  aggregates remain unscoped groupings, as the inlined subqueries were.

The rule this decision establishes: **an aggregate that combines assignments
and transactions at category or budget level may only be written in
`envelope.ts`.** Account balances are deliberately outside — Balance is the
account-side term, Remaining the envelope-side term (see CONTEXT.md).

## Consequences

- One implementation and one test surface for the cutoff semantics (month
  rollover, future-dated entries, pending counts, income exclusion).
- A hand-rolled assignment⨝transaction aggregate found outside `envelope.ts`
  in review is a defect by definition, not a judgement call.
- The consolidation is strictly behavior-preserving; known semantic quirks
  (all-time unassigned counting future income, #44) become documented
  columns and can be changed later as small local edits behind the seam.
- Callers' tests shrink to composition concerns (archived filtering,
  ordering, target percentage); invariant tests are not triplicated.
