# Design Language

The locked visual rules for the app. Later work applies these instead of
re-litigating taste. Palette token values live in `src/routes/layout.css`
(`@theme`); typography is defined under Typography below.

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
   in `layout.css` `@theme`, so `rounded-xs`…`rounded-xl` are interchangeable
   aliases — markup keeps its `rounded-*` classes and the tokens carry the
   look. Don't introduce visually different corner radii.
4. **Compact data, tight chrome.** Table rows ≈ 36px (`px-2 py-1` cells,
   `size-7` drag handle). Page chrome gaps are 16px (`gap-4`), not 24px.
5. **Rows are zebra stripes on an open ledger.** The category table has no
   outer frame, no row borders and no slabs: rows sit transparent on the page
   background with an `even:bg-muted/3` stripe and `hover:bg-muted/5`; column
   structure is carried by alignment alone. Mobile cards keep the bordered
   `bg-surface` slab look — the zebra treatment applies to the desktop table.
6. **Headers are quiet chrome.** Column headers: `h-8 text-xs tracking-wider
uppercase text-muted font-display font-medium`, uniform — no loud bold
   header cells (Lora caps need 500 to hold their own at 12px). On the zebra
   open ledger the header row carries the contrast bar (`bg-muted/3` +
   `border-b border-muted/30`); the register's floating header stays bare.
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

## Interaction-layer rules

- Interactive table cells stay `p-0`; their fill-height triggers must reach
  the cell border so the hover/focus outline sits at the row edge, never
  inset by cell padding. Density lives in the trigger's own padding.
- Feedback paints above state decoration: triggers that sit under overlays
  like the target-progress bar get `relative hover:z-10 focus-visible:z-10`
  so outline/fill cover the decoration while active.
- Match outline width and negative offset (1px ↔ `-outline-offset-1`) or the
  outline floats inside the edge.

## Form-control family

The primitives in `src/lib/components/ui` (button, button-group, input,
input-group, input-money, input-password, textarea, label, checkbox, select,
select-category, toggle-group, calendar, date-picker, form-field, form-body)
apply the language as follows:

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
- **Control chrome is flat**: adaptive `bg-muted/5` fill (a translucent tint
  keeps fields one step darker than any host surface — a solid `bg-surface`
  vanishes on same-colored overlays), `border-muted/20`, no shadows (shadows
  stay overlay-only per P2).
- **Focus beats the error halo.** Invalid controls always show
  `border-error`; the soft `ring-3 ring-error/20` halo is suppressed while
  the control (or, for wrapper chrome, its inner form control) is
  focus-visible, so the gold ring stays unmistakable.
- **Disabled is 50% opacity** everywhere; buttons also drop pointer events.

## Overlay family

Dialog, alert-dialog(-form), drawer, responsive-modal, popover
(-form), dropdown-menu, select:

- **One surface: `bg-surface-high`.** The top layer gets the top token —
  every overlay panel (drawer, alert-dialog, menus, popover, select,
  toast) fills `bg-surface-high`, except the plain `Dialog`, which
  fills `bg-surface` (inherited by the desktop face of
  `responsive-modal`). Calendar keeps its in-popover transparency.
- **Chrome: hairline + one shadow.** Panels carry `ring-1 ring-foreground/10`
  (the drawer its directional `border-muted/20` edge) plus `shadow-md` —
  the single overlay shadow step (P2: shadows are overlay-only).
- **Anchored cell overlays are the exception.** Popovers that unfold a
  ledger cell or header in place (`category-popover`, `reassignment-popup`,
  `category-archive-popover` in the month view) wear
  `rounded-xs bg-surface p-0 shadow-sm ring-1 ring-muted/30` with
  anchor-matched width — a cell opening on the page's own surface token
  with the flattest shadow, not a detached `bg-surface-high` layer.
- **The mobile nav FAB floats at overlay tier.** The fixed drawer trigger in
  `navigation-mobile` hovers detached above the page, so its inverted
  `bg-foreground` chip wears the single overlay shadow step (`shadow-md`) —
  it is not an in-page surface under P2.
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

## Table family

The two flagship tables implement the two identities of P8:

- **Budget month table — zebra open ledger.** The P5 zebra treatment at P4
  density: transparent rows, `even:bg-muted/3` stripes (desktop only; mobile
  cards stay slabs), `hover:bg-muted/5`, header bar per P6.
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
- **Amounts are `font-currency`** in every table (see Money under
  Typography); labels, dates and empty markers stay in the normal sans.

## Data-display & feedback family

table, pagination, empty-state, separator, collapsible, toaster,
version-label, source-link:

- **Tables wear the zebra open ledger** (P5/P6) at P4 density.
  `tfoot` is the symmetric bookend bar (`bg-muted/3` + `border-t
border-muted/30` + `font-medium`) — the table closes the way it opens. The
  framed grid stays the register's signature (P8); non-flagship tables
  default to the quiet ledger.
- **Pagination's current page wears the interactive tint** (the default
  button variant, `bg-interactive/10 text-interactive`); all other links are
  ghost buttons. Prev/next keep their text labels beside the chevrons; the
  ellipsis matches the `icon-sm` metrics (`size-8 text-muted`).
- **Empty state is a hairline dashed frame**: `border-dashed
border-muted/20`, `py-8`, muted icon over title/description with an
  optional action row.
- **Toasts wear the overlay chrome**: `bg-surface-high`, `shadow-md` +
  `ring-1 ring-foreground/10`; variant-colored text is state feedback (P1)
  and the alternating sticker tilt stays.
- **Separator is the `bg-muted/20` hairline; collapsible stays an
  unstyled behavior primitive** (call sites own its trigger/content look);
  version-label and source-link stay quiet `text-xs text-muted`.

## Navigation shell

The desktop rail keeps its left-sidebar placement but goes quiet at table
density; `info` is the "you are here" hue.

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
  No `bg-info/10` tints, no marker bars. Hover stays neutral (`bg-muted/5`,
  P7).
- **Utilities sit behind a hairline** (`border-t border-muted/20`) at the
  rail's foot: muted `size-4` icons + labels, active = `font-medium
text-info`. No per-action accent colors (P1).
- **Drag handles are quiet and hover-revealed**: `size-4 text-muted`
  six-dot grip at the row's right edge, `opacity-0 group-hover:opacity-100
focus-visible:opacity-100` — reorder stays discoverable without
  furnishing the rail.
- **The mobile drawer mirrors the rail, flat, at touch density**: budgets
  and their indented accounts flow as one group and the utility list sits
  behind the same `border-t border-muted/20` hairline as the rail. Same
  idiom as desktop: active budget in `info` ink with its inline `size-1.5`
  dot (transparent slot on the rest so labels align), accounts as
  `text-muted` sub-items behind the `size-3` bend-arrow, neutral
  `bg-muted/5` hover. Only the scale differs for touch — `text-lg` rows,
  `p-2` tap targets, `size-6` utility icons.
- **Page chrome gaps are 16px by default**: `Page.Root` and `Page.Header`
  ship `gap-4`, `Page.Content` its grid's `gap-y-4` (P4 generalized).

## Typography

Three families, loaded via Fontsource in `layout.css`:

- **IBM Plex Sans** (`--font-sans`, variable) — every piece of UI text:
  body, navigation, buttons, labels, hints, toasts.
- **IBM Plex Mono** (`--font-mono`, 400 + 500) — money and only money,
  applied via the `font-currency` utility.
- **Lora** (`--font-display`, variable) — the single display voice:
  wordmark, page titles, section titles, table column headers, brand
  small print.

Hierarchy rules:

- **Page title**: `text-3xl font-bold` at natural letter spacing — no
  `tracking-tighter` on the serif (tight tracking crushes it). `h1`–`h3`
  get `font-display` from the base layer in `layout.css`; weight and size
  stay per-site utilities.
- **Modal titles** (dialog/drawer/alert titles): `font-display text-lg
font-semibold` — 18px, one step above section titles. Modals nest section
  titles (e.g. the "Accounts" heading in Budget Settings), so the modal
  title needs its own tier to avoid colliding with them. All three modal
  faces share the size so a responsive modal reads the same on desktop
  (dialog) and mobile (drawer). Applied in the shared `ui/dialog`,
  `ui/drawer`, `ui/alert-dialog` title primitives — every modal inherits it.
- **Section titles** (empty-state titles, section headings inside a surface,
  `h2`/`h3`): `font-display font-semibold` at the base 16px — 600 has
  authority without competing with the 700 page title or the 18px modal
  title above it.
- **Table column headers**: the P6 quiet chrome plus `font-display
font-medium`.
- **Form labels — one spec**: `pl-1.5 text-sm font-semibold tracking-tight`,
  shared by `ui/label` and `ui/form-field`.
- **Buttons**: `text-sm font-medium` in the `buttonVariants` base. Table
  cell triggers are bare buttons and inherit their surrounding data text —
  never give data cells button chrome typography. `xs` keeps `text-xs`;
  the month button keeps `text-base font-bold`.
- **Money**: `font-currency` = `font-mono text-[0.9375em] font-normal
tabular-nums` — em-based so amounts scale with their context, regular
  weight because the mono texture already carries emphasis. Emphasized
  figures (the Unallocated chip, archive/delete summaries) add
  `font-medium`; never semibold or bold on amounts.

## Reference implementation

The budget month view (`src/routes/(app)/[budgetId=id]/[month=month]/`) is
the reference screen: `category-budget-table.svelte`,
`budget-table-cell.svelte`, `budget-table-header.svelte`,
`reassignment-popup.svelte`, `category-assignment-form.svelte`,
`category-popover.svelte`, `unassigned-summary.svelte`, plus the radius
tokens in `src/routes/layout.css`.
