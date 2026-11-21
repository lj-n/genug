# ADR-0017: Checkpoints seal account-side facts only

Date: 2026-10-08
Status: accepted

## Context

An account's validated Balance drifts from the real bank balance over time — a
mistyped amount, a forgotten transaction — and finding a few cents of drift in a
long register is tedious. A **Checkpoint** (see GLOSSARY.md) records the moment
the user confirmed that the validated Balance equals the bank balance, so any
later drift is confined to transactions not yet covered by a Checkpoint.

That guarantee only holds if covered transactions cannot silently change, and if
"covered" is unambiguous. Two questions had real alternatives.

**How coverage is stored.**

- _A third transaction state_ (pending → validated → sealed) — no history: when
  the bank agreed, and at what balance, is lost, and nothing can be undone
  precisely.
- _A Checkpoint record with a date cutoff_ — everything dated on or before the
  cutoff counts as covered. A transaction added later with an earlier date
  silently lands inside an old Checkpoint and breaks it unnoticed.
- _A Checkpoint record that covered transactions link to_ — history is kept,
  undo is exact, and a backdated transaction stays uncovered until a later
  Checkpoint takes it in.

**How strong the seal is.**

- _Seal everything_ — no edit to a covered transaction until the Checkpoint is
  deleted. Recategorising an old transaction becomes a chore unrelated to the
  bank.
- _Seal account-side facts only_ — block exactly the edits that can move the
  account's Balance or rewrite the Checkpoint's history.
- _Warn and drop out_ — any edit is allowed after a confirmation and the
  transaction leaves its Checkpoint. The guarantee becomes advisory, and the
  drift the feature exists to localise can reappear inside a Checkpoint.

## Decision

A Checkpoint is its own record (account, entered bank balance, creator, time).
Setting one links every validated, not-yet-covered transaction of the account to
it, in one database transaction. A covered transaction is always validated;
"sealed" means "linked to a Checkpoint". A Checkpoint covering no new
transactions is allowed — it records that the bank still agreed.

When the difference is nonzero, setting the Checkpoint books an **Adjustment**
— a validated, uncategorised transaction for exactly the difference — created
and sealed atomically with the Checkpoint. This is the normal path, not a
fallback: genug shows the Adjustment needed rather than making the user hunt
for the cause of small drift. The Checkpoint therefore always succeeds; the
entered bank balance and the validated Balance agree by construction.

A Checkpoint seals the **account-side facts** of the transactions it covers:
amount, account, date, and validated state; a covered transaction cannot be
deleted. Its **envelope-side facts** — category and notes — stay editable,
because they move money between envelopes but never the account's Balance. A
Transfer (ADR-0015) is sealed as soon as either leg is covered: its shared facts
— amount, date, accounts — are locked and it cannot be deleted, since editing it
rewrites both legs. A leg's validated state stays its own account's business: an
uncovered leg of a sealed Transfer can still be validated, so that account's next
Checkpoint can cover it. Locking it too would leave the leg pending forever,
with only a Checkpoint on the other account able to release it.

Only an account's **latest** Checkpoint can be deleted. Deleting unlinks exactly
the transactions it covered and removes the record; it never rewrites a
transaction, so an Adjustment survives as an ordinary, unsealed transaction.

All of this is enforced in user-context (ADR-0001): the transaction, transfer,
and validate commands reject changes to sealed facts with a thrown error, as a
backstop against stale or forged requests; the UI projects the seal so sealed
fields are not offered for editing. Setting and deleting Checkpoints is
member-available, like validating transactions.

## Consequences

- Drift found after a Checkpoint is always among the uncovered transactions.
- Fixing a wrong category on an old, covered transaction needs no ceremony;
  fixing a covered amount means deleting Checkpoints back to the one covering
  it, newest first.
- An Adjustment counts as income (or its reversal) and so moves Unassigned.
- Deleting an account cascades its Checkpoints. Deletable still requires no
  transactions, so only Checkpoints over a zero Balance can be lost.
- An archived account is inert (see Archivable): no Checkpoint can be set or
  deleted on it.
