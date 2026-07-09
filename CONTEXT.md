# genug-da

Envelope budgeting: money in a budget is assigned to categories month by month, and spending is tracked against those assignments.

## Language

**Month**:
The unit of budgeting time — a specific calendar month (e.g. January 2025) that scopes assignments, activity, and the budget view. Represented by the `Month` type in `src/lib/utils/month.ts`; obtain values through its interface, never by casting.
_Avoid_: date, period, month param

**Money**:
A quantity of currency stored as an integer count of the smallest unit (cents for EUR/USD). Represented by the `Money` branded type in `src/lib/utils/money.ts`; obtain values through `parseMoney` or `MoneySchema`, never by casting. Format for display with `formatMoney`, unwrap for arithmetic and interop with `unwrapMoney`.
_Avoid_: amount, cent value, float, display value

**Archivable**:
A category is archivable when its remaining balance (all-time assignments plus transactions) is zero and it has no pending (unvalidated) transactions. The rule is enforced by `category.archive` in user-context (see ADR-0001) and projected to the UI via `category.archivability`; nothing else may write `archivedAt`.
_Avoid_: deletable, closable

**Focus treatment**:
The canonical focus indicator — `border-focus` plus `ring-2 ring-focus/50` — owned by `src/lib/components/ui/focus-ring` in two flavors: `focusRing` (`focus-visible:`) for direct controls and `focusRingWithin` (`focus-within:`) for containers wrapping a focusable child. Focusable elements compose one of these instead of styling their own ring or falling back to the browser outline; input chrome gets it via `inputVariants` in `src/lib/components/ui/input`.
_Avoid_: custom outline, per-component ring values

**Adapter**:
A mechanical entry point (remote function or server load) that connects SvelteKit to user-context: it guards auth, validates input, translates form semantics, redirects, and refreshes caches — but produces no values and holds no business rules (see ADR-0002).
_Avoid_: endpoint, controller, service layer

**Read site**:
The place in markup where a remote query's value is actually consumed. Queries are awaited at their read site, not at component top level, unless the value is read unconditionally in always-rendered markup (see ADR-0003).
_Avoid_: usage point, consumer location

**Hot path**:
An interaction whose server round-trip is felt because the user repeats it rapidly (e.g. assigning money to categories). Only hot paths may use optimistic query overrides; everything else refreshes single-flight.
_Avoid_: critical path, fast path

**Feature module**:
A component directory coupled to a specific application capability — imports remote functions, orchestrates forms, owns interaction state. Lives under `src/lib/components/features/`, one directory per capability with an `index.ts` barrel; consumers import from the explicit path (e.g. `$lib/components/features/account`). Primitives in `src/lib/components/ui` stay feature-agnostic: no remote functions, no domain logic, at most type-only domain imports.
_Avoid_: shared component, domain component, widget
