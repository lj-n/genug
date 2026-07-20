# ADR-0011: Account deletion is guarded, not cascading

Date: 2026-07-14
Status: accepted

## Context

An account needs a real, permanent delete — Archive only hides an account that
still carries history; it does not remove one created by mistake or never used
(issue #130, mirroring the category lifecycle of ADR-0008). The `accounts` table
already declares the `archivedAt` column and the `account_active` partial index,
so Archive needs no schema change; the open question is what a hard delete may do.

The schema primes deletion to succeed silently. `transactions.account_id` is
`ON DELETE CASCADE`, so a naive hard delete would remove the account **and every
transaction in it**. That is sharper than the category case: category deletion
cascades `transactions.category_id` `ON DELETE SET NULL` (orphaned transactions
survive, misread as income — the hazard ADR-0008 guards), whereas account
deletion cascades a full `DELETE` — the transactions vanish outright. Because a
categorized transaction is spending and an uncategorized one reads as income
(per the **Unassigned** definition), cascade-deleting an account's transactions
would silently rewrite the budget's money math _and_ destroy the account's
history with no way back.

Two shapes were considered: let the schema cascade run (hard delete that also
deletes the account's transactions), or guard deletion so it is only allowed
when there is nothing to lose.

## Decision

Account deletion is **guarded**, not cascading. An account is deletable only
when it is **Deletable** — no transaction of any kind references it (see
CONTEXT.md). Because an account's Balance is nothing but the sum of its
transactions, "no transactions" subsumes "zero Balance"; there is no separate
envelope/assignment dimension as there is for categories. The rule is enforced
by `account.delete` in user-context as a backstop against stale or forged
requests (ADR-0001), and projected to the UI via `account.deletability` so the
client can predict the outcome rather than attempt the command.

Because the guard forbids any referencing transaction, the
`transactions.account_id` `ON DELETE CASCADE` path is unreachable in practice; it
is retained as a schema-level safety net, not relied upon. This deliberately
mirrors ADR-0008: the schema's `ON DELETE` behavior is unchanged; the decision
constrains _when_ a delete is allowed, not the schema.

`user_entity_order` rows key on `(userId, entityType, entityId)` with a foreign
key only on `userId` — there is no cascade on the account id. `account.delete`
removes the account's order row(s) itself so no orphaned ordering entry lingers,
exactly as `category.delete` does.

An account created with a starting balance is a hard-delete case worth naming:
`account.create` writes a validated income transaction for a nonzero starting
balance, so such an account is not immediately deletable — it already holds a
transaction. No special case is made for it; the starting-balance transaction
must be removed first, then the account deleted. Keeping the guard pure (zero
transactions, no exceptions) is preferred over a "starting-balance-only" escape
hatch that would re-introduce the cascade this ADR exists to forbid.

## Consequences

- The budget's money math is protected: deleting an account can never silently
  delete transactions that count as income or spending, because an account with
  any transaction is not deletable.
- Deletion is member-available (guarded by `accessGuard`/`hasAccess`, like
  Archive), not owner-only — an empty, inert account carries no risk.
- An account that still holds a balance or has transactions cannot be deleted;
  the user must empty it (e.g. move the money out via a transfer, #129) and
  remove its transactions first, or Archive it instead.
- A mistyped account created with a starting balance is deletable only after its
  starting-balance transaction is removed; the `deletability` guard feedback
  tells the user so.
- The existing foreign-key `ON DELETE` behaviors are unchanged; this decision
  constrains _when_ a delete is allowed, not the schema.
