# ADR-0013: Mobile responsiveness via container-query reflow of the content tables

Date: 2026-07-14
Status: accepted

## Context

Issue #133 (spec #128) asks for the core flows to be usable on a phone — a
self-hoster recording spending at the store one-handed. The ticket framed this
as "extend the tablet layouts down to the phone breakpoint", but there is no
distinct tablet layout to extend: the app shell already adapts below 1536px via
container queries — the sidebar is `hidden` and only `@7xl/main:flex`
(`src/routes/(app)/navigation.svelte`), everything below gets the mobile drawer
navigation. What actually breaks on a phone is the content: the dense
transaction register and the monthly budget table are fixed multi-column grids
(`whitespace-nowrap` flex rows in the budget table being the worst overflow
offender), and the month-view header row overflows 375px.

The real work is therefore reflowing the content tables, not building a new
mobile UI or touching the shell. Two responsive mechanisms were on the table:
viewport media queries (the `responsive-modal` shell already uses one at 640px)
or container queries against the existing `@container/main` context.

## Decision

**Reflow via container queries, at a shared `@3xl` (768px) threshold of the
`@container/main` content area.** Below `@3xl/main` a table renders as a
stacked list; at or above it, the current dense table. One responsive model,
matching the shell's existing container-query adaptation — no second,
conflicting media-query system for layout. (The `responsive-modal`'s 640px
viewport query stays what it is: it picks a modal _chrome_ — Dialog vs. bottom
Drawer — not a layout.)

**Scope rule: mobile = core flows only, not feature parity.** Desktop
power-features are dropped below the threshold for now: category drag-reorder
(its grab handle is the only drag entry point) and move-money-between-categories
(`transfer-popup.svelte`).

**Transaction register** — the same grid, re-templated below `@3xl`: the
validated toggle becomes a full-height right rail (its own ≥44px tap zone);
line 1 is category · amount (signed, color-coded headline), line 2 is notes
(muted). Rows are grouped by date, newest-first, with no per-date subtotal.
Tapping a card opens the edit surface. The accessibility tree stays
`role="table"`, with date groups as `role="rowgroup"` — an adaptation, not a
DOM rewrite, satisfying the a11y pass (#128 T8) "proper headers and roles".

**Mutations open the existing bottom-sheet.** Create transaction, edit
transaction, and assign-to-category all go through the `responsive-modal`
shell (vaul-svelte bottom drawer below 640px, `max-h-[80vh]`, drag handle) —
including the assign hot path: drawer consistency was chosen over
inline-popover latency on mobile. The inline create-row is replaced on mobile
by the top create button opening that sheet.

**Budget table** — same treatment: below `@3xl` each category is a card with
name + **Remaining** headline (color-coded); the secondary line is Assigned
(tap → assign sheet) and Activity (read-only).

**Month-view header** — prominent-stack below `@3xl`: the month-navigator row
first, then a full-width UnassignedSummary band. The `Page.Header` icon-button
group needed no redesign.

**Tap targets:** 44×44px floor on every interactive control in reflowed views.

**Verification:** Playwright at 375×667 (iPhone SE) is the source of truth —
the five core flows (add transaction, assign, view month, add
account/category, login) plus an explicit `scrollWidth <= clientWidth`
no-horizontal-overflow assertion. Thin component tests cover only the
date-grouping logic and the mobile list rendering; the container-query reflow
itself is not jsdom-testable.

## Consequences

- Any component below the content area can adapt with `@3xl/main:` variants
  and agree with every other table about when "mobile" starts; nothing reads
  the viewport for layout.
- Date grouping and the tap-to-edit affordance cannot be expressed in CSS
  alone, so the register renders two bodies (dense rows / grouped cards) and
  container queries pick one — hidden DOM is duplicated, mounted forms are
  not (they mount on interaction).
- Dropping drag-reorder and transfers on mobile keeps the cards simple, at
  the cost of two desktop-only features; both can be reintroduced behind
  mobile-appropriate affordances later.
- `CONTEXT.md` is deliberately unchanged: this is pure implementation, no new
  domain term crystallized.
