# ADR-0015: Account transfers are budget-neutral linked transaction pairs

Date: 2026-07-16
Status: accepted

## Context

A self-hoster needs to move money between their own accounts (checking →
savings, cash withdrawal, credit-card payment) without distorting the budget
(issue #129, spec #128). The envelope math routes every transaction by its
`categoryId`: rows **with** a category are envelope activity (Remaining, via
`categoryBalances`), rows **without** one are budget income (Unassigned /
Position, via `unassigned()`). A transfer must land in **neither** pot — it
moves money between accounts, not in or out of the budget.

Three shapes were considered:

- **Single-row counter-account model** — one transaction row referencing a
  second account. Rejected at the milestone grilling: every balance and
  register query would need to double-read the row with flipped sign, and
  per-account reconciliation (a `validated` flag per side) has no home.
- **Unlinked pair with prose linkage** — two ordinary transactions whose
  `notes` describe the counterpart. Rejected here: notes are user-owned free
  text, invisible to queries. Consistent edits and atomic deletes need to
  _find_ the counterpart leg; budget-math exclusion needs a column to filter
  on; and a user editing a note could sever a financial invariant.
- **Linked pair via a grouping column** — two ordinary transactions sharing a
  `transferId`. Chosen.

## Decision

A **Transfer** (see CONTEXT.md) is a pair of ordinary transactions sharing a
nullable `transferId` grouping column — one negative leg in the source
account, one positive leg in the destination account, both in the same budget,
created atomically by the `transfer` command in the transaction user-context.

**Transfer legs carry no category — ever.** The invariant is enforced at the
schema level with a CHECK (`transfer_id IS NULL OR category_id IS NULL`), in
the same declarative style as the existing `date_format` CHECK and the
composite budget FKs, so no present or future write path can produce a
categorized leg. This holds even when the user thinks of the moved money as
belonging to an envelope ("moving my grocery money to savings"): envelopes are
account-agnostic — Remaining never asks which account money sits in — so a
category-free transfer leaves every envelope untouched, which is exactly the
desired outcome. A categorized transfer leg would instead count as envelope
spending while its counterpart counts nowhere, silently corrupting Remaining.

**Budget neutrality is explicit, not incidental.** The income query in
`unassigned()` excludes rows with a non-null `transferId` rather than relying
on the two legs cancelling out (cancellation breaks the moment legs diverge
across a month boundary or one leg is deleted mid-flight). For the same
reason, the register's "no category" filter (`UNASSIGNED` sentinel) — whose
domain meaning is _income_ — excludes transfer legs; a separate `TRANSFER`
sentinel filters for them instead.

**Edit refuses, delete cascades — deliberately asymmetric.** Editing a single
leg is ambiguous per field (what does changing the inflow leg's amount mean
for the signs? which account is "from"?), so the generic `edit` command throws
on transfer legs and a dedicated `editTransfer` updates both legs atomically
with pair-level fields (amount as positive magnitude, one date, one notes,
from/to accounts). Deleting a leg has exactly one legal meaning — the whole
transfer goes — so the generic `delete` command expands any selection to
include counterpart legs and removes whole transfers atomically. `validated`
stays per-leg and is never implicitly touched: each account reconciles against
its own statement, and validation in this app is purely user-controlled.

## Consequences

- Account Balances include transfer legs (that is the point); envelope math
  and the unassigned breakdown never see them.
- Every account in this app is a budget account, so every transfer is
  budget-neutral and category-free without exception. If off-budget
  (tracking) accounts ever land (#151), transfers crossing the budget
  boundary would need a category, and the CHECK must be revisited in that
  migration.
- The pair-level invariants SQLite cannot express (exactly two legs, amounts
  summing to zero, distinct accounts, same budget) are enforced by the
  user-context commands per ADR-0001; the CHECK covers only the row-level
  no-category invariant.
- Adding the CHECK requires a SQLite table rebuild (drizzle-kit generates
  it); a plain `ADD COLUMN` would not have.
- Archive/delete lifecycle guards need no special casing: a pending transfer
  leg blocks archiving and any transfer leg blocks account deletion, exactly
  like ordinary transactions (ADR-0011).
