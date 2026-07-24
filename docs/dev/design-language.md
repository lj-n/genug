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
5. **Rows are zebra stripes on an open ledger.** (Revised in the #259
   table sessions — the original #255 "rows are slabs" lock is retired.)
   The category table has no outer frame, no row borders and no slabs:
   rows sit transparent on the page background with an `even:bg-muted/3`
   stripe and `hover:bg-muted/5`; column structure is carried by alignment
   alone. Mobile cards keep the bordered `bg-surface` slab look — the
   zebra revision applies to the desktop table.
6. **Headers are quiet chrome.** Column headers: `h-8 text-xs tracking-wider
uppercase text-muted`, uniform — no loud bold header cells. On the zebra
   open ledger the header row carries the contrast bar (`bg-muted/3` +
   `border-b border-muted/30`); the register's floating header stays bare
   (amended in #259).
7. **Hover is neutral and crisp; gold means keyboard.** Hover feedback =
   `outline-1 -outline-offset-1 outline-foreground/50` flush with the
   element edge (+ `bg-surface` fill on table cell triggers). The solid 2px
   gold focus ring (`ring-focus`) appears only on `:focus-visible` — gold
   exclusively means "keyboard focus is here". No accent-colored hover.
8. **The two main views are immediately distinguishable.** The budget
   month table and the transaction register are the app's two flagship
   surfaces and must never share an identity: the month view is the
   _zebra open ledger_ (P5), the register is the _framed spreadsheet
   grid_ (see Table family below). Don't blur them by reusing one idiom
   on the other.

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
- **Control chrome is flat**: adaptive `bg-muted/5` fill (amended in #258 —
  was `bg-surface`, which vanished on same-colored overlay surfaces; the
  translucent tint keeps fields one step darker than any host),
  `border-muted/20`, no shadows (shadows stay overlay-only per P2).
- **Focus beats the error halo.** Invalid controls always show
  `border-error`; the soft `ring-3 ring-error/20` halo is suppressed while
  the control (or, for wrapper chrome, its inner form control) is
  focus-visible, so the gold ring stays unmistakable.
- **Disabled is 50% opacity** everywhere; buttons also drop pointer events.

## Overlay family (#258)

Dialog, dialog-form, alert-dialog(-form), drawer, responsive-modal, popover
(-form), dropdown-menu, select, command. Reviewed live in both modes;
decision trail in the (deleted) gallery's NOTES survives in the #258 PR.

- **One surface: `bg-surface-high`.** The top layer gets the top token —
  every overlay panel (modals, drawer, menus, popover, select, command)
  fills `bg-surface-high`. Calendar keeps its in-popover transparency.
- **Chrome: hairline + one shadow.** Panels carry `ring-1 ring-foreground/10`
  (the drawer its directional `border-muted/20` edge) plus `shadow-md` —
  the single overlay shadow step (P2: shadows are overlay-only; the inline
  command palette is in-page and therefore shadowless).
- **Scrim is a veil, not a dimmer:** `bg-background/75` +
  `supports-backdrop-filter:backdrop-blur-xs` on dialog/alert-dialog/drawer
  overlays — the page washes out into the theme's own background token
  (the token-veil idiom, not a black scrim).
- **Motion lives in `src/lib/components/ui/overlay-motion/`** ("slingshot
  light"): entries drop in from the anchor side with a slight backOut
  overshoot (modals 12px/240ms, floating 8px/200ms), exits are quick fades
  (130/100ms), scrim fades 200ms. All overlays use bits-ui's `forceMount` +
  `child` snippet with `in:`/`out:` directives — the asymmetry is
  load-bearing (spring curves look wrong reversed). Drawer motion belongs
  to vaul, forced to 300ms via `!duration-300`, no overshoot.
  `prefers-reduced-motion` collapses durations to 0; the check guards
  `window.matchMedia` because jsdom lacks it entirely.
- **Body seam breathing room.** `Dialog.Body`/`Drawer.Body` are the scroll
  seam (ADR-0013) with `-m-1 p-1` so the overflow clip sits 4px outside the
  content — edge-flush fields keep their focus ring and error halo. They
  must not be `flex-1` (WebKit resolves flex-basis 0 to zero intrinsic
  height and Safari collapses the body).
- **Footers converge:** right-aligned button row from `sm` up, full-width
  `flex-col-reverse` stack below (drawer + alert-dialog; plain dialog
  footers are a wrapping right-aligned row).
- **Dialog width is a component default** (`sm:max-w-lg`, mobile capped to
  `calc(100% - 2rem)`); callers override only for intentional sizes
  (`sm:max-w-md`, `sm:max-w-4xl`).
- **Menu highlight stays neutral** (`bg-muted/10`-family fills, per the
  select rule above); destructive items are the exception: focus fill
  `bg-error/5` under `text-error` — the fill itself carries the warning
  (P1).

## Table family (#259 table sessions)

The two flagship tables were nailed live on real data (session log:
`src/routes/(app)/[budgetId=id]/[month=month]/NOTES.md` on branch
`restyle-tables-259`); they implement the two identities of P8:

- **Budget month table — zebra open ledger.** No outer frame, no row
  borders: transparent rows with `even:bg-muted/3` stripes (desktop only;
  mobile cards stay slabs), `hover:bg-muted/5`, compact ~36px density,
  header bar `bg-muted/3` + `border-b border-muted/30`.
- **Transaction register — framed spreadsheet grid.** `rounded-xs border
border-muted/20 bg-surface` frame wraps the data rows ONLY; the quiet
  header floats above (`mb-1 h-8`, no fill) and pagination is a flat line
  below. Every cell carries `border-b border-l border-muted/10` hairlines
  (`first-of-type:` drops the frame-adjacent left one, the last row its
  bottom one). Sort carets: active = foreground ink, inactive = muted.
- **Click-to-edit is structural, not class discipline.** Read row and edit
  form are ONE component per row type; the cell divs persist across modes,
  so geometry is pixel-locked by construction. The shared class idioms
  (cells, triggers, borderless edit inputs, `minmax(0,…)` tracks) live in
  `src/lib/components/features/transaction/transaction-table-cols.ts`.
- **Open form rows** (edit/create): uniform `bg-interactive/5` wash +
  `ring-1 ring-interactive/40` over the whole row (gold stays
  keyboard-only), `xs`/`icon-xs` action buttons in a `p-1 gap-1` bar,
  150ms `transition:slide`.
- **Amounts are `font-currency`** (medium tabular numerals) in every
  table; labels, dates and empty markers stay in the normal sans.

## Data-display & feedback family (#259)

table, pagination, empty-state, separator, collapsible, toaster,
version-label, source-link — reviewed primitive-by-primitive in both modes
on a live gallery (deleted after review; decision trail in the #259 PR):

- **Generic `ui/table` wears the zebra open ledger** (P5): flush
  transparent rows (`even:bg-muted/3`, `hover:bg-muted/5`), the
  `bg-muted/3` + `border-b border-muted/30` header bar, compact `px-2 py-1`
  cells under the P6 header treatment. `tfoot` is the symmetric bookend bar
  (`bg-muted/3` + `border-t border-muted/30` + `font-medium`) — the table
  closes the way it opens. The framed grid stays the register's signature
  (P8); non-flagship tables default to the quiet ledger.
- **Pagination's current page wears the interactive tint** (the default
  button variant, `bg-interactive/10 text-interactive`; amended in #260 —
  the #259 solid-ink fill read as misplaced black); all other links are
  ghost buttons.
  Prev/next keep their text labels beside the chevrons; the ellipsis
  matches the `icon-sm` metrics (`size-8 text-muted`).
- **Empty state is a hairline dashed frame**: `border-dashed
border-muted/20`, `py-8`, muted icon over title/description with an
  optional action row.
- **Toasts wear the overlay chrome** (#258): `bg-surface-high`,
  `shadow-md` + `ring-1 ring-foreground/10`; variant-colored text is state
  feedback (P1) and the alternating sticker tilt stays.
- **Separator is the `bg-muted/20` hairline; collapsible stays an
  unstyled behavior primitive** (call sites own its trigger/content look);
  version-label and source-link stay quiet `text-xs text-muted`.

## Navigation shell (#260)

Locked in a live prototype session (five keep-and-replace rounds on real
data, both modes; decision trail in the #260 PR). The desktop rail keeps
its left-sidebar placement but goes quiet at table density; `info` is the
"you are here" hue.

- **Quiet rail, 224px** (`max-w-56`), rows at table density (`px-2 py-1
text-sm`), section seams `mt-6`, no "Budgets" section label — group gaps
  and connectors carry the structure.
- **Budgets anchor their group in resting ink**: `font-medium
text-foreground` at rest; accounts are `text-muted` sub-items indented
  `ml-3` behind the bend-arrow connector (`ArrowBendDownRightBold`,
  `size-3`). No slabs, no tree guides on desktop.
- **Active location is `info` text, not a fill**: the current budget or
  account turns `text-info` (budget rows additionally fill their inline
  `size-1.5` dot slot `bg-info`; the account's arrow turns `text-info`).
  No `bg-info/10` tints, no marker bars — the old colored-active idiom is
  retired. Hover stays neutral (`bg-muted/5`, P7).
- **Utilities sit behind a hairline** (`border-t border-muted/20`) at the
  rail's foot: muted `size-4` icons + labels, active = `font-medium
text-info`. No per-action accent colors (P1).
- **Drag handles are quiet and hover-revealed**: `size-4 text-muted`
  six-dot grip at the row's right edge, `opacity-0 group-hover:opacity-100
focus-visible:opacity-100` — reorder stays discoverable without
  furnishing the rail.
- **The mobile drawer keeps slabs, drops shadows**: budget + accounts and
  the utility list sit on `rounded-md border border-muted/20 bg-surface`
  cards (flat per P2 — the drawer panel owns the overlay shadow), touch
  paddings retained, same ink/`info` active idiom as the rail.
- **Page chrome gaps are 16px by default now**: `Page.Root` and
  `Page.Header` ship `gap-4`, `Page.Content` its grid's `gap-y-4` (P4
  generalized); the month view's call-site overrides are gone.

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
- Overlay _content_ on some screens (e.g. the reassignment combobox's
  balance pills, tinted `bg-success/20`) still shows positive-state color;
  apply principle 1 when those surfaces are touched (#258 restyled the
  overlay chrome, not every screen's overlay content).
- `--radius-*` collapse means `rounded-xs`…`rounded-xl` are aliases; a later
  cleanup can normalize class usage to one step.
