# ADR-0016: Accessibility is gated on the core flows at WCAG 2.1 AA, not site-wide

Date: 2026-07-17
Status: accepted

## Context

Issue #136 (spec #128, T8) asks for the core flows to be usable by keyboard and
screen reader with sufficient colour contrast in both themes. The ticket is
explicit that this is a **bounded** pass — "not full WCAG AA certification of
every screen" — and scheduled last of the eight so it verifies against the final
dark tokens (#134, ADR-0010) and the final mobile reflow (#133, ADR-0014), both
now merged.

"Bounded" needs a concrete, durable meaning, or it decays into either a one-time
manual sweep that rots on the next component, or an ever-expanding site-wide
audit the ticket explicitly rules out. Two things had to be pinned: **what the
conformance surface is** (which flows, which states) and **what enforces it over
time** (a persistent gate vs. a check performed once).

The core flows are fixed by the spec: add transaction, assign money, view month,
add account/category, login — plus transfers, which are held to the same bar
because their create/edit rows live inside the transaction register and any
sweep of that table lands on them anyway.

The contrast half is not a free verification: measuring the merged tokens shows
the dark theme passes AA everywhere, but the light theme fails in four places,
all the same shape — a semantic colour used as text (or, for focus, as the
indicator) dips below AA, most sharply on its own tinted background.
`--color-focus` (2.04:1, the focus-ring seam behind the _Focus treatment_ term)
and `--color-success` (2.98:1 as text) fail outright; `--color-muted` (4.46:1)
and `--color-error` (4.33:1) fail on their own `/10` tinted backgrounds — the
axe run surfaced the latter two, which a static read of the tokens on white
would have missed. Meeting the criterion therefore forces token-value changes,
not just markup fixes.

## Decision

**The accessibility bar is WCAG 2.1 AA, enforced on the core flows only, by an
automated axe gate in CI — not a site-wide audit and not a one-time sweep.**

- **Surface.** The enumerated core flows plus transfers. Not AAA, not exotic
  ARIA widgets, not full-site certification. axe runs with tags
  `wcag2a, wcag2aa, wcag21aa` (the `best-practice` tag is excluded — it flags
  non-required rules and would turn the gate into noise).

- **Enforcement.** A `@axe-core/playwright` spec, kept in CI, driving each flow
  to **every meaningful interactive state** — base page plus open
  dialogs/popovers, the inline create row, and validation-error states —
  through the existing `tests/playwright/pom` layer. A static-page-only gate
  would pass while the dense create row and modals stayed broken, which is
  exactly the risk. The chrome-devtools a11y skill is a diagnostic aid while
  fixing, never the deliverable.

- **Keyboard-completability is verified hybrid.** axe cannot see focus order,
  traps, or Enter/Escape behaviour. The one flow where keyboard order genuinely
  breaks and stays complex — the transaction create/edit/validate row — gets a
  Playwright keyboard-traversal test; the trivial flows (login, add
  account/category, assign, view month) get a written keyboard checklist run
  once and recorded in the PR. Blanket keyboard automation was rejected as
  brittle for flows that will never regress.

- **Markup stays ARIA-grid.** The app-wide `role="table"` div-grid convention
  (transaction register and category-budget table, the substrate for the
  container-query reflow in ADR-0014) is _completed and corrected_, not
  converted to native `<table>`: `aria-sort` on the sortable headers; the
  pagination and empty state moved out of the `role="table"` (a table may only
  own rows/rowgroups); and the inline create/transfer rows render the popover
  content _onto_ their `form[role="row"]` via bits' `child` snippet, so no
  wrapper `div` sits between the rowgroup and the row. Converting to native
  tables would fight the responsive reflow both tables depend on and
  re-architect a house style for a bounded pass.

- **Contrast is fixed at the failing light tokens, not per usage.**
  `--color-focus`, `--color-success`, `--color-muted`, and `--color-error` are
  nudged darker in light theme only, each to the minimum that clears its bar
  (focus ≥3:1 as the indicator; the others ≥4.5:1 as text, including on their
  `/10` tints), hue preserved. Nudging the token fixes every usage at the source
  — one darkened `--color-error` clears the "Overspent" summary and the
  archive/delete warnings together — rather than recolouring flagged spots one
  by one. The dark theme and all other tokens are untouched.

## Consequences

- The gate makes "axe-clean on the core flows" _stay_ true — a new component
  that breaks a core flow fails CI — without claiming or implying conformance
  anywhere else. A future contributor must read the tag set and the driven
  flows as the exact scope, and must not assume screens outside it are AA.
- Scope is a maintenance boundary, not just a launch scope: extending AA to a
  new screen is a deliberate act (add it to the axe spec), never automatic.
- Retuning four light tokens is a visible, deliberate shift of the light
  palette's gold, green, red, and grey, carried as one `Changed` changelog
  entry; the values are re-verified by the same gate.
- `CONTEXT.md` is deliberately unchanged: this pass verifies and completes
  existing terms (_Focus treatment_, _Empty state_) and the token retune is an
  implementation value, not a glossary meaning.
