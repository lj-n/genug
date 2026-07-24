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

### Round 1 → 2

- User picked **A (Quiet rail)** as the direction; B (top bar) and C (inline
  header) are out. Round-1 files snapshotted in `history/`.
- Feedback: "I need at least some color to highlight the current location" —
  pure-ink active state is too quiet.
- Round 2 = three takes on the rail differing only in the active treatment
  (all `info`-colored; hue is swappable):
  - **A — color marker**: 2px left `border-info` marker, label stays ink.
  - **B — tinted pill**: rounded `bg-info/10 text-info` fill (today's idiom,
    strongest dose).
  - **C — text + dot**: `text-info` label + small leading dot, no fills.

### Round 2 → 3

- Feedback: indentation alone doesn't say "these are accounts of this
  budget"; a second budget + accounts is needed to judge grouping; the
  budget/account drag handles disappeared and must stay visible somehow.
- Seeded a second budget ("Travel", 3 accounts) directly into the worktree's
  dev-DB copy.
- All three slots keep their round-2 active treatment and gain hover-reveal
  drag handles (visual-only — reorder stays unwired in the prototype) plus a
  per-variant grouping idiom:
  - **A**: accounts hang off a vertical hairline tree guide under the budget.
  - **B**: budget + accounts share a bordered `bg-surface` slab (the mobile
    drawer idiom).
  - **C**: accounts lead with the bend-arrow connector (today's idiom).

### Round 3 → 4

- **C (dot + arrows) wins round 3** — grouping via bend-arrow connectors.
  A (tree guide) and B (slabs) are out; round-3 files in `history/`.
- Open question from the user: is the "Budgets" section label needed?
- Round 4 = C in three label treatments; C itself unchanged as control:
  - **A — no label**: label deleted, gaps + arrows carry structure alone.
  - **B — no label, ink budgets**: label deleted, budget rows anchored at
    rest in `text-foreground font-medium` (accounts stay muted).
  - **C — with label**: round-3 C untouched.
