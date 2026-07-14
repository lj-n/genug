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
The lifecycle predicate for hiding an entity that still carries history — it holds no money and has nothing pending to reconcile. For a **category**: all-time Remaining is zero and it has no pending (unvalidated) transactions. For an **account**: its Balance is zero and it has no pending transactions — the account-side (Balance) analog of the category's envelope-side (Remaining) rule. The rule is enforced by `{category,account}.archive` in user-context (see ADR-0001) and projected to the UI via `{category,account}.archivability`; nothing else may write `archivedAt`. Archive only hides existing history; it never rewrites transactions. An archived **account** is additionally inert: `transaction.create` rejects a new transaction targeting it (a stale tab or back-navigation cannot write to it) and its detail page shows a restore notice in place of the register.
_Avoid_: deletable, closable

**Deletable**:
The lifecycle predicate for permanently removing an entity — nothing of value would be lost. For a **category**: all-time Remaining is zero and no transaction of any kind — pending or validated — references it. For an **account**: no transaction of any kind references it (which subsumes a zero Balance, since an account's Balance is nothing but its transactions). Strictly stronger than Archivable (which forbids only pending transactions): Deletable ⟹ Archivable, never the reverse. The rule is enforced by `{category,account}.delete` in user-context (see ADR-0001, ADR-0008, ADR-0011) and projected to the UI via `{category,account}.deletability`; nothing else may hard-delete the entity. Deletion is permanent — the opposite of Archive, which only hides.
_Avoid_: archivable, removable, trashable

**Focus treatment**:
The canonical focus indicator — `border-focus` plus `ring-2 ring-focus/50` — owned by `src/lib/components/ui/focus-ring` in two flavors: `focusRing` (`focus-visible:`) for direct controls and `focusRingWithin` (`focus-within:`) for containers wrapping a focusable child. Focusable elements compose one of these instead of styling their own ring or falling back to the browser outline; input chrome gets it via `inputVariants` in `src/lib/components/ui/input`.
_Avoid_: custom outline, per-component ring values

**Adapter**:
A mechanical entry point (remote function or server load) that connects SvelteKit to user-context: it guards auth, validates input, translates form semantics, redirects, and refreshes caches — but produces no values and holds no business rules (see ADR-0002).
_Avoid_: endpoint, controller, service layer

**Hot path**:
An interaction whose server round-trip is felt because the user repeats it rapidly (e.g. assigning money to categories). Only hot paths may use optimistic query overrides; everything else refreshes single-flight.
_Avoid_: critical path, fast path

**Remaining**:
The envelope-side running position of a category: the sum of its assignments plus the sum of its transactions. The term is incomplete without a cutoff — all-time Remaining governs Archivable; Remaining up to a Month drives the month view. Computed only in user-context.
_Avoid_: balance (account-side, see Balance), leftover, available

**Unassigned**:
Budget money outside every envelope, as seen from a Month: the lowest running position — income (transactions without a category) minus assignments, accumulated month by month — at the Month or any later month. Exactly: `Unassigned(M) = min over K ≥ M of (income≤K − assignments≤K)`. Like Remaining, the term is incomplete without a cutoff — it is month-scoped, not budget-lifetime, and comparisons are month-granular. Taking the minimum over future positions keeps the no-double-assignment guarantee (a future deficit reaches back as the intended negative "spending money you don't have" warning) while future income counts only from its own month onward — it can never fund an assignment in a month before it arrives (ADR-0007). Advisory only — never a thrown rule. Computed only in user-context.
_Avoid_: available, to be budgeted, free money

**Position**:
The running position of a budget through a Month: income (transactions without a category) up to and including the month, minus assignments up to and including the month — ignoring later months. One term of the Unassigned breakdown (`Unassigned = Position − Reserved`), shown as "Stand" in the German UI. Computed only in user-context, inside the same min-scan as Unassigned (ADR-0004, ADR-0007).
_Avoid_: balance (account-side, see Balance), available

**Reserved**:
The part of a Month's Position withheld because a later month runs lower: `Position − Unassigned`, never negative. Zero exactly when the viewed month is itself the minimum — then no Bottleneck exists and the UI omits the row. Shown as "Reserviert" in the German UI.
_Avoid_: available, held back, blocked

**Bottleneck**:
The earliest month at/after the viewed Month whose Position equals the minimum defining Unassigned — the month pinning the value. Null when the viewed month is itself the minimum (Reserved = 0); ties break toward the earliest month, the first that binds. Shown as "Engpass" in the German UI.
_Avoid_: constraint, limiting month

**Balance**:
The account-side sum of transactions in an account — what is physically there, split into validated and pending. Says nothing about envelopes; the envelope-side term is Remaining.
_Avoid_: remaining (envelope-side), funds

**Feature module**:
A component directory coupled to a specific application capability — imports remote functions, orchestrates forms, owns interaction state. Lives under `src/lib/components/features/`, one directory per capability with an `index.ts` barrel; consumers import from the explicit path (e.g. `$lib/components/features/account`). Primitives in `src/lib/components/ui` stay feature-agnostic: no remote functions, no domain logic, at most type-only domain imports.
_Avoid_: shared component, domain component, widget

**Contained form**:
A form living inside a closing container — dialog, alert-dialog, or popover. The container closing is the success signal; validation issues render inline at the field; thrown errors (see ADR-0001) render inline in the container, which stays open. The counterpart of a Standing form. Feedback rules in ADR-0009.
_Avoid_: modal form, popup form

**Standing form**:
A form that remains on screen after a successful submit (settings, in-place edits, invitations). Success must be signaled explicitly — an anchored toast at the element that triggered the submit — but only when the submit produces no visible state change there; a visible change (an item appearing, moving, or leaving) is itself the signal, and adding a toast on top is noise. The counterpart of a Contained form. Feedback rules in ADR-0009.
_Avoid_: inline form, static form, page form

**Theme override**:
The per-device theme preference held in the `theme` cookie: `system`, `light`, or `dark`. `system` — and any absent or unrecognised cookie — follows the OS `prefers-color-scheme`; `light`/`dark` force that theme and win over the OS signal. Resolved to an `<html>` class by `resolveThemeClass` in `src/lib/utils/theme.ts`, the single source consumed by both `hooks.server.ts` (server-set class, no SSR flash) and the client switcher (see ADR-0010). A device preference, never an account setting and never synced across browsers.
_Avoid_: dark mode toggle, theme setting, color scheme (that names the OS signal, not the override)
