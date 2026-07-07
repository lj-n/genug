# genug-da

Envelope budgeting: money in a budget is assigned to categories month by month, and spending is tracked against those assignments.

## Language

**Month**:
The unit of budgeting time — a specific calendar month (e.g. January 2025) that scopes assignments, activity, and the budget view. Represented by the `Month` type in `src/lib/utils/month.ts`; obtain values through its interface, never by casting.
_Avoid_: date, period, month param

**Archivable**:
A category is archivable when its remaining balance (all-time assignments plus transactions) is zero and it has no pending (unvalidated) transactions. The rule is enforced by `category.archive` in user-context (see ADR-0001) and projected to the UI via `category.archivability`; nothing else may write `archivedAt`.
_Avoid_: deletable, closable
