# ADR-0008: Category deletion is guarded, not cascading

Date: 2026-07-12
Status: accepted

## Context

A category needs a real, permanent delete — Archive only hides a category that
still carries history; it does not remove one created by mistake or never used.
The schema already declares foreign keys for a category's dependants:
`transactions.category_id` is `ON DELETE SET NULL`, `budget_assignments.category_id`
is `ON DELETE CASCADE`. A naive hard delete would lean on those cascades.

The problem is the `SET NULL` path. Per the **Unassigned** definition an
uncategorized transaction reads as income, so nulling a category's transactions
would silently convert its spending into income and inflate Unassigned — a
budget that no longer adds up. Deleting a category with spending must never
happen quietly.

Two shapes were considered: let the schema cascades run (hard delete that
orphans transactions to `categoryId = null`), or guard deletion so it is only
allowed when there is nothing to lose.

## Decision

Category deletion is **guarded**, not cascading. A category is deletable only
when it is **Deletable** — all-time Remaining is `0` and no transaction of any
kind references it (see CONTEXT.md). The rule is enforced by `category.delete`
in user-context as a backstop against stale or forged requests (ADR-0001), and
projected to the UI via `category.deletability` so the client can predict the
outcome rather than attempt the command.

Because the guard forbids any referencing transaction, the
`transactions.category_id` `SET NULL` path is unreachable in practice; it is
retained as a schema-level safety net, not relied upon. The surviving
`budget_assignments` rows net to zero across all months (Remaining is `0`) and
are removed by the existing `ON DELETE CASCADE`; their per-month amounts flow
back to Unassigned in the months they occupied. No reassignment, no merge.

`user_entity_order` rows key on `(userId, entityType, entityId)` with a foreign
key only on `userId` — there is no cascade on the category id. `category.delete`
removes the category's order row(s) itself so no orphaned ordering entry lingers.

## Consequences

- The Unassigned invariant holds: deleting a category can never turn spending
  into income, because a category with any transaction is not deletable.
- Deletion is member-available (guarded by `accessGuard`/`hasAccess`, like
  Archive), not owner-only — an empty, inert category carries no risk.
- A category that still holds money or has transactions cannot be deleted; the
  user must empty the envelope and recategorize or remove its transactions
  first, or Archive it instead.
- The existing foreign-key `ON DELETE` behaviors are unchanged; this decision
  constrains _when_ a delete is allowed, not the schema.
