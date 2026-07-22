# Design Language

Locked detail-by-detail on the budget month view with live user feedback
(#255). Later restyle sessions apply these rules instead of re-litigating
taste. The default palette was locked in #256 (hand-tuned from One Light /
Kanagawa Dragon starting points, token values in `src/routes/layout.css`);
typography (type scale, fonts) is #261.

## Principles

1. **Color is meaning, and problems get it first.** Neutral chrome
   everywhere; hue only where it encodes money or system state. Positive
   balances don't need color — plain foreground ink. Negative/overspent state
   is `text-error` (or `bg-error/10 text-error` for the Unallocated chip).
   Zero is `text-muted`. Progress green (`bg-success`) is allowed only as a
   target-progress indicator, not as a "balance is fine" decoration.
2. **Flat surfaces.** In-page elements get no shadows and no border+shadow
   combos. State chips are flat tints (`bg-<state>/10`, no border). Shadows
   are reserved for overlays (popovers, dialogs).
3. **One radius token: 4px.** All `--radius-*` steps collapse to `0.25rem`
   in `layout.css` `@theme`. Markup keeps its `rounded-*` classes; the
   tokens carry the look. Don't introduce visually different corner radii.
4. **Compact data, tight chrome.** Table rows ≈ 36px (`px-2 py-1` cells,
   `size-7` drag handle). Page chrome gaps are 16px (`gap-4`), not 24px.
5. **Rows are slabs, columns are alignment.** The category table has no
   outer frame and no column separators: each row is its own slab
   (`rounded-xs border border-muted/20 bg-surface`) in a `grid gap-2`.
   Column structure is carried by alignment alone.
6. **Headers are quiet chrome.** Column headers: `h-8 text-xs tracking-wider
uppercase text-muted`, uniform — no loud bold header cells.
7. **Hover is neutral and crisp; gold means keyboard.** Hover feedback =
   `outline-1 -outline-offset-1 outline-foreground/50` flush with the
   element edge (+ `bg-surface` fill on table cell triggers). The solid 2px
   gold focus ring (`ring-focus`) appears only on `:focus-visible` — gold
   exclusively means "keyboard focus is here". No accent-colored hover.

## Interaction-layer rules (found the hard way)

- Interactive table cells stay `p-0`; their fill-height triggers must reach
  the cell border so the hover/focus outline sits at the row edge, never
  inset by cell padding. Density lives in the trigger's own padding.
- Feedback paints above state decoration: triggers that sit under overlays
  like the target-progress bar get `relative hover:z-10 focus-visible:z-10`
  so outline/fill cover the decoration while active.
- Match outline width and negative offset (1px ↔ `-outline-offset-1`) or the
  outline floats inside the edge.

## Form-control family (#257)

The primitives in `src/lib/components/ui` (button, button-group, input,
input-group, input-money, input-password, textarea, label, checkbox, select,
select-category, toggle-group, calendar, date-picker, form-field, form-body)
apply the language as follows; reviewed control-by-control in both modes on
a live gallery:

- **Shared interaction constants** live in `src/lib/components/ui/focus-ring`:
  `hoverOutline` (the P7 neutral hover outline, `not-disabled`-guarded) and
  `invalidRing`/`invalidRingWithin` (error halo). Use these instead of
  restating the classes.
- **Selection is ink.** Checked/indeterminate checkboxes, the active
  toggle-group item and the selected calendar day fill
  `bg-foreground text-background`. Select/combobox item highlight is a
  neutral `bg-muted/10` fill. Today in the calendar is a `border-muted/40`
  frame.
- **Buttons keep tinted variant fills at rest** (`bg-interactive/10` etc. —
  the tint reads as affordance meaning under P1); hover adds only the
  neutral outline, never a deeper tint. Ghost hovers `bg-muted/10`.
- **Control chrome is flat**: `bg-surface` fill, `border-muted/20`, no
  shadows (shadows stay overlay-only per P2).
- **Focus beats the error halo.** Invalid controls always show
  `border-error`; the soft `ring-3 ring-error/20` halo is suppressed while
  the control (or, for wrapper chrome, its inner form control) is
  focus-visible, so the gold ring stays unmistakable.
- **Disabled is 50% opacity** everywhere; buttons also drop pointer events.

## Reference implementation

The budget month view (`src/routes/(app)/[budgetId=id]/[month=month]/`) is
the reference screen: `category-budget-table.svelte`,
`budget-table-cell.svelte`, `budget-table-header.svelte`,
`reassignment-popup.svelte`, `category-assignment-form.svelte`,
`category-popover.svelte`, `unassigned-summary.svelte`, plus the radius
tokens in `src/routes/layout.css`.

## Known follow-ups (not blocking)

- Other screens still use the old idiom (colored hover accents, tinted
  positive pills, mixed spacing); migrate them screen by screen against this
  document.
- Overlay internals (e.g. the reassignment combobox's balance pills, tinted
  `bg-success/20`) still show positive-state color; apply principle 1 when
  those surfaces are touched.
- The `Page.Root`/`Page.Content` `gap-6` defaults still hold app-wide; the
  month view overrides to `gap-4` at the call site. Generalize when a second
  screen adopts the language.
- `--radius-*` collapse means `rounded-xs`…`rounded-xl` are aliases; a later
  cleanup can normalize class usage to one step.
