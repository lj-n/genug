# ADR-0007: Unassigned is month-scoped with reach-back

Date: 2026-07-12
Status: accepted

## Context

`budget.unassigned` computed income (transactions with `categoryId IS NULL`)
minus **all** assignments, with no date condition on either side (#44). The
number is therefore budget-lifetime: the month-view unassigned summary shows the
same value on every month page, and a future-dated income (salary dated the 25th,
recorded on the 11th) raises unassigned today, letting the user assign money they
have not received — with no view flagging it. Unlike Remaining, which already
carried a cutoff, Unassigned had none.

Making income month-scoped is the fix, but the two sides are not symmetric:

- **Assignments must stay reach-across-time.** Money assigned to a future month
  is spoken for and must reduce unassigned now, or the same euro could be
  assigned twice (once in January, again in March).
- **Income should not leak from the future.** A later-dated income raising the
  present month's unassigned is the reported bug.

Three cutoff shapes were considered:

- **Symmetric (`both ≤ M`).** Ruled out in the issue body: dropping future
  assignments reintroduces the double-assignment hole.
- **Plain asymmetric (`income ≤ M − all assignments`).** Every past month whose
  successor months carry assignments shows a large spurious negative — January
  fully assigned plus February fully assigned makes the January page read
  `−(February assignments)` — pinning the error state on permanently.
- **Reach-back.** Charge the present month only for the part of future
  assignments that future income does not yet cover.

## Decision

Unassigned becomes month-scoped with reach-back, computed only in `envelope.ts`
(ADR-0004 — the assignment⨝transaction math lives there and nowhere else):

```
Unassigned(M) = income≤M − assignments≤M − max(0, assignments>M − income>M)
```

- Comparisons are **month-granular**: income by `strftime('%Y%m', date)`,
  assignments by their `month` column. A salary dated July 25 counts on the July
  page even on July 11 — the month is the planning unit; only cross-month leakage
  was the bug.
- **No `today`.** The envelope seam stays pure (no clock injection); numbers are
  deterministic per month.
- `unassigned(db, budgetId, month)` and `queries.unassigned(budgetId, month)`
  widen to take the month; `getUnassigned` widens to `BudgetMonthSchema`. It
  stays a **separate scalar query**, not folded into `getMonthly` — both
  consumers want exactly one number and `refreshBudgetData` already unifies the
  refresh flow.
- **Advisory only.** `budget.assignment` keeps accepting anything; a negative
  Unassigned stays a displayed warning (red state in `unassigned-summary.svelte`),
  never a thrown rule. This preserves the optimistic assignment hot path and
  pre-assigning before salary lands.

## Consequences

- A fully-assigned past month reads zero instead of a spurious negative:
  future assignments covered by future income reach back nothing.
- Assigning in a future month with no recorded income there turns the present
  month's Unassigned negative — the intended "assigning money you don't have"
  warning. Pre-recording the expected income clears it.
- The no-double-assignment guarantee holds: future assignments reduce present
  Unassigned exactly to the extent future income does not cover them.
- Unassigned now carries a cutoff like Remaining; CONTEXT.md records the term as
  incomplete without one.
