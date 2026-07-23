# PROTOTYPE — Shell restyle (#260)

**Question:** Apply the locked design language to the app shell (side-menu,
navigation, page primitive, root layout). How quiet can the chrome get while
staying navigable?

**Plan:** Three shell variants plus the current shell as baseline, switchable
via `?variant=` (persisted in sessionStorage across in-app navigation) on any
`(app)` route, dev-only, floating switcher bottom-center. Mobile keeps the
existing drawer in round 1 — the desktop shell is the question; the winner's
idiom informs the drawer restyle afterwards.

## Round 1 variants

- **`current`** — baseline: today's shell, untouched (old idiom: `bg-info/10`
  actives, colored icons, 288px sidebar).
- **`A` — Quiet rail.** Sidebar stays, stripped to ink and hairlines: 224px,
  no colored actives (active = `border-l-2 border-foreground` marker +
  `font-medium` ink), muted rest state, uppercase section label, utilities
  pinned behind a hairline at the bottom. Keeps full Logo (version/source).
- **`B` — Top bar.** Chrome collapses to a 48px hairline-bottom app bar:
  compact wordmark, budgets as quiet tabs (active = bottom ink bar) opening a
  dropdown (overview + accounts), utilities as muted icon buttons right.
  Content gets the full width below (max-w-8xl).
- **`C` — Inline header.** The extreme: no persistent chrome surface at all.
  A single breadcrumb line inside the content column (tiny wordmark /
  budget ▾ / account ▾, ⋯ menu right) over a narrow document column
  (max-w-5xl).

## Known prototype shortcuts (not design decisions)

- Drag-to-reorder (budgets/accounts) is omitted in all variants — read-only
  prototype. The winner must find a home for reorder (SideMenu's drag
  handles today).
- Section labels ("Budgets") are hardcoded English; implement pass adds
  messages.
- Mobile drawer untouched in all variants.

## Feedback log

_(appended per round)_
