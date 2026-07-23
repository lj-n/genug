# #258 — Overlay & menu restyle session notes

Throwaway gallery at `/prototype-overlays` (delete before merging into
`restyle`). Question: apply the locked design language + palette
(`docs/dev/design-language.md`) to the overlay family, including open/close
motion.

## Round 1 — mechanical pass (no user feedback yet)

Clear-cut violations fixed straight from the locked doc:

- `dropdown-menu` checkbox-item / radio-item / sub-trigger: solid
  `focus:bg-info` highlight → neutral `focus:bg-muted/10` (menu highlight is
  neutral, like the #257 select).
- `dropdown-menu-item`: destructive focus fill `bg-error/5` → neutral
  `bg-muted/10` (text/icon stay `text-error` — color is meaning, fills are
  neutral). Fixed a broken variant line where the `interactive` styles were
  gated on `data-[variant=destructive]`.
- `command-item`: selected `bg-info/5 text-info` → neutral `bg-muted/10`,
  no text recolor.
- `dropdown-menu-group-heading`: `text-sm font-semibold` → quiet
  `text-xs font-medium text-muted` (headers are quiet chrome).
- Border opacity unified to `border-muted/20`: command root, drawer content.
- `dropdown-menu-sub-content`: `shadow-lg` → `shadow-md` to match the parent
  menu.

## Round 2 — setup feedback (4 issues reported)

- **Dialog max width** (real fix): every app caller hand-set `max-w-md/lg/4xl`.
  `dialog-content` now defaults to `sm:max-w-lg` (mobile keeps the
  `calc(100%-2rem)` margin cap); swept the redundant `max-w-lg`/`gap-6`
  overrides from all callers, kept intent at `invitation` (`sm:max-w-md`) and
  `account-settings` (`sm:max-w-4xl`).
- **Empty dialog/drawer bodies** (real bug, Safari): `Dialog.Body` and
  `Drawer.Body` used `min-h-0 flex-1`; WebKit resolves flex-basis 0 to zero
  intrinsic height under the content's `h-fit`/`h-auto`, collapsing the body
  entirely (all Safari/iOS users; cmux pane is WebKit, which is how it
  surfaced). Chrome sizes from content, so e2e never caught it. Fix:
  `flex-1` → `shrink`. Needs a CHANGELOG `Fixed` entry at branch finish.
- **Alert dialog layout** (gallery mistake): `AlertDialog.Media` must sit
  inside `AlertDialog.Header` (its grid owns the media slot); fixed in the
  gallery.
- **Drawer footer** (real fix): was `flex-col` with `w-fit` buttons stacking
  narrow/left. Now full-width stacked buttons below `sm`
  (`flex-col-reverse *:w-full`), row right-aligned from `sm` up — matching
  the alert-dialog footer pattern.

CHANGELOG entries (Fixed: Safari empty modal bodies; Changed: dialog default
width, drawer footer layout) are deferred to branch finalization.

## Open taste questions for the live review

1. **Motion.** Dialog flies in from x:6/y:6; popover and dropdown fly
   sideways (x:6) regardless of which side they open on; alert-dialog uses
   fade+zoom-95 instead. Proposal: unify on a quiet fade (+ tiny scale or
   2–4px slide from the anchor side), ~120–150ms.

- 2. **Scrim.** `bg-black/10` + backdrop blur on dialog/drawer/alert-dialog —
     keep the blur, darken, or flatten?

3. **Drawer background.** Drawer uses `bg-background`, dialogs use
   `bg-surface`; popover/command use `bg-surface-high`. Standardize overlay
   surfaces?
4. **Overlay chrome.** Dialogs have `ring-foreground/10` and no shadow;
   popover/menus have ring + `shadow-md`. Shadows are overlay-only per P2 —
   should dialogs get one, or is the scrim enough?
5. **Command internals.** `command-input` wraps InputGroup with `!`
   overrides (`h-8!`, `rounded-lg!`, stray `focus-within:` class); command
   root carries its own border+shadow even when nested inside a dialog.
   Structural cleanup candidate.
6. **Destructive item focus fill** — now neutral `bg-muted/10` with red
   text; alternative is keeping a faint `bg-error/5`. Review live.

## Round 3 — transitions (dedicated round)

Pattern decision per <https://bits-ui.com/docs/transitions>: bits-ui
recommends `forceMount` + `child` snippet with Svelte transitions (floating
components additionally spread `wrapperProps`). Everything converged on that
pattern; the CSS `data-open:animate-in`/tw-animate-css idiom is gone from
the overlay family.

- New shared module `src/lib/components/ui/overlay-motion/` (shape follows
  `focus-ring/`): `scrimFade` (fade 150ms), `modalScale` (fade + scale from
  0.98, 150ms), `floatingSlide` (fade + 4px slide from the anchor side,
  120ms, keyed off bits-ui's `data-side` on the content props). All collapse
  to 0ms under `prefers-reduced-motion` — read lazily at play time via a
  guarded `window.matchMedia` because jsdom has no `matchMedia` at all, and
  both `svelte/motion`'s `prefersReducedMotion` (module-load `MediaQuery`)
  and an unguarded call broke the `*-form` component tests: the throw is
  swallowed by the transition machinery and overlays get stuck open.
- `dialog-content`: diagonal `fly x:6/y:6` → `modalScale`. forceMount/child
  structure, `onOpenAutoFocus` workaround, close button, ADR-0013 capping
  untouched.
- `popover-content` / `dropdown-menu-content`: sideways `fly x:6` →
  `floatingSlide` with real `data-side`; stray `duration-100` removed.
- `dropdown-menu-sub-content`: converted from CSS animate-in to
  forceMount/child + `floatingSlide` (verified `side=right` live).
- `alert-dialog-content` + `-overlay`: converted from CSS animate-in
  (fade+zoom-95, 100ms) to forceMount/child with `modalScale`/`scrimFade`.
  Centering stays `top-1/2 left-1/2 -translate-*` — safe because Tailwind 4
  translate uses the `translate` property, so Svelte's `transform: scale()`
  composes with it.
- Drawer untouched: vaul-svelte owns slide/drag; its overlay keeps the CSS
  `data-open` fade (tw-animate-css import in `layout.css` stays for it).
- Verified in the WebKit pane: dialog, alert-dialog, popover
  (`data-side=bottom`), dropdown + submenu, drawer, command dialog all
  open/close cleanly. `npm run check`, lint, and the three `*-form` test
  suites pass (32/32).

New open question found this round:

7. **Select popup motion.** `select-content` (locked in #257) still uses
   the CSS animate-in idiom (fade+zoom-95, 100ms) — now the only
   non-drawer overlay off-pattern. Adopt `floatingSlide` too, or leave
   #257 territory alone?

Timing values (150/120ms, 4px slide, 0.98 scale) are the agreed proposal —
validate live and tune here.

### Variant comparison (prototype-skill style, round 1)

`overlay-motion.ts` temporarily switches on `motionVariant.current`, driven
by `?variant=` on the gallery (floating bar: ‹ › arrows, `←`/`→` keys, both
wrap). Collapse to the winner and remove the switch + gallery wiring before
merging. Slots keep stable keys across rounds; replaced variants get
snapshotted to `history/` first.

- **A · micro-slide** — modals fade + scale from 0.98 (150ms); floating
  fade + 4px slide from the anchor side (120ms). The round-3 proposal.
- **B · fade only** — pure opacity everywhere, zero movement (130/100ms).
  Maximally flat reading of the design language.
- **C · grow & rise** — modals fade + 8px upward rise (160ms); floating
  fade + scale from 0.95 growing out of the anchor corner via
  `--bits-floating-transform-origin` (130ms). The livelier end of quiet.

Feedback log:

- **Round 1 verdict:** "they all look the same" — the quiet spread
  (micro-slide / fade-only / grow & rise) was too subtle to distinguish.
  All three slots replaced; snapshot in `history/round-1-overlay-motion.ts`.
- **Round 2 (springs):** structural change — enter/exit split into
  `modalIn`/`modalOut` + `floatingIn`/`floatingOut` (`in:`/`out:`
  directives instead of `transition:`), because spring curves look wrong
  reversed. Exits are always a quick fade (130ms modal / 100ms floating);
  scrim fades 200ms. Spring easings are hand-rolled (`backOut(s)`,
  `springBounce(decay, omega)`) so overshoot only affects the transform —
  opacity ramps in linearly over the first 40%.
  - **A · soft spring** — backOut(1.7), ~10% overshoot. Modals scale from
    0.95 (280ms); floating slide 8px from the anchor side (240ms).
  - **B · bouncy pop** — damped oscillation (decay 5, ω = 3π): one big
    bounce + one small. Modals scale from 0.75 (500ms); floating pop out
    of the anchor corner from 0.75 (400ms).
  - **C · slingshot** — backOut(2.6), hard overshoot. Modals drop in from
    24px above and swing past (320ms); floating sling 12px in from the
    anchor side (280ms).
- **Round 2 verdict:** C (slingshot) wins the direction. Snapshot in
  `history/round-2-overlay-motion.ts`.
- **Round 3 (slingshot takes):** C kept unchanged as reference; A and B
  replaced with variations on it:
  - **A · slingshot light** — backOut(2.0), modals drop 12px (240ms),
    floating 8px (200ms). Restrained, production-friendly.
  - **B · slingshot bounce** — springBounce(4, 3π) on the travel axis:
    drops past the resting point, bounces back, settles. Modals 36px
    (480ms), floating 16px (400ms).
  - **C · slingshot** — unchanged round-2 winner (24px/320ms modal,
    12px/280ms floating, backOut(2.6)).
- **Round 3 verdict:** B (slingshot bounce) wins; asked to be snappier.
  Snapshot in `history/round-3-overlay-motion.ts`.
- **Round 4 (tuning B):** same curve compressed — modals 28px/320ms
  (was 36px/480ms), floating 12px/260ms (was 16px/400ms).
  springBounce(4, 3π) unchanged, so the rebound is proportionally the
  same but lands ~35% faster.
- **Round 4 verdict — LOCKED: A (slingshot light).** backOut(2.0):
  modals drop in 12px/240ms, floating surfaces 8px/200ms from the anchor
  side; exits quick fades (130/100ms), scrim 200ms.
- **Round 5 (lock-in):** variant switch collapsed out of
  `overlay-motion.ts` (final form: `floatingIn`/`floatingOut`,
  `modalIn`/`modalOut`, `scrimFade`); gallery switcher removed. Extended
  to the rest of the family per user instruction:
  - `select-content` converted from the CSS animate-in idiom to
    forceMount/child + `floatingIn`/`floatingOut` (resolves open
    question 7). Select section added to the gallery to verify.
  - Drawer: vaul hardcodes `transition: … 0.5s` inline, so
    `drawer-content` and `drawer-overlay` force `!duration-300`
    (verified computed 0.3s live). No overshoot on the drawer — an
    edge-anchored sheet would expose a gap behind it; it keeps vaul's
    decel curve, just faster. Drag behavior untouched (vaul sets
    `transition: none` inline while dragging, which wins on
    transition-property).

## Round 4 — scrim (open question 2)

Gallery-only CSS overrides (`data-proto-scrim` on `<html>`, components
untouched until verdict). Round 1 spread: A current (`black/10` + blur-xs),
B flat dark (`black/35`, no blur), C veil (`background` token 60% + blur).

- **Round 1 verdict:** leaning C. Best-practice check: C = shadcn's original
  `bg-background/80 backdrop-blur-sm` token-veil recipe (semantic-token
  overlay is again an open shadcn request); Material/current-shadcn use a
  dark scrim (32%–80% black) for maximal modality signal; blur is aesthetic,
  GPU-costly, `prefers-reduced-transparency` exists. If C: raise wash toward
  70–80%, keep `supports-backdrop-filter` guard; interacts with question 4
  (same-color veil lowers dialog edge contrast in light mode → shadow
  earns its place).
- **Round 2 (converging):** A kept as reference; B dropped; C split into
  C 60+blur / C 75+blur / C 75 flat.
- **Round 2 verdict — LOCKED: C 75+blur.** `bg-black/10` →
  `bg-background/75` on dialog/alert-dialog/drawer overlays;
  `supports-backdrop-filter:backdrop-blur-xs` guard kept. Gallery switcher
  removed. Follow-up carried to question 4: with a same-color veil the
  dialog's light-mode edge separation leans on ring/shadow.

## Round 5 — overlay surfaces + input fill (open question 3)

Bar variants: surface A current mix / B all high / C tiered (drawer up one);
follow-up input-fill group A `bg-surface` / B `bg-muted/5` tint / C
`bg-background` recessed.

- **Surface verdict — LOCKED: B, all overlays on `bg-surface-high`.**
  Applied beyond the modal slots the gallery switched, for the principle
  "top layer gets the top token": dialog, alert-dialog, drawer (was
  `bg-background`), dropdown content + sub-content, select-content (+ its
  scroll buttons, which must stay opaque over the list), select-category
  popup. Popover/command/date-picker popup/toast already were.
  Calendar keeps `bg-surface` with its existing in-popover transparency.
- **User-reported problem 1** (inputs invisible on same-color surface) →
  **input fill LOCKED: B, adaptive `bg-muted/5`** (the form-body idiom:
  consistent one-step-darker on any host). Swept: input-variants
  (default + container — covers input, textarea, input-group inputs),
  input-group wrapper, select-trigger, checkbox, toggle-group root,
  date-picker trigger (incl. its `hover:bg-surface` pin → `bg-muted/5`).
  Amends #257's "control chrome is `bg-surface`" rule —
  `docs/dev/design-language.md` update due at finalization.
  `input-variants.test.ts` canonical-chrome assertions updated.
- **User-reported problem 2** (focus ring/border clipped in form dialogs,
  real pre-existing bug): the body seam's `overflow-y-auto` clips
  box-shadows and edge-flush `w-full` fields sit exactly on its boundary
  (verified: ring bottom cut at body bottom). Fix: `-m-1 p-1` on
  `Dialog.Body` and `Drawer.Body` — identical layout, clip edge moved 4px
  out so the 2px focus ring and 3px error halo survive.
- WebKit-pane caveat: synthesized keyboard input never sets
  `:focus-visible`, so the gold ring can't be triggered by automation —
  verified via forced box-shadow instead.

## Round 6 — modal chrome (open question 4)

Bar variants: A ring only (current) / B ring + shadow-md / C ring +
shadow-lg. First take replaced the ring (Tailwind `ring-1` is itself a
box-shadow) — refixed to stack ring + shadow.

- **Verdict — LOCKED: B.** `shadow-md` added to dialog-content,
  alert-dialog-content and drawer-content, matching the floating overlays'
  existing `shadow-md`: one uniform overlay shadow story. Ring/border chrome
  unchanged (drawer keeps its directional `border-muted/20` edge instead of
  a ring).

## Round 7 — command internals (open question 5, applied as cleanup)

- Command root: dropped the in-page `shadow` (P2 — inline command is an
  in-page element; in the command dialog the dialog chrome carries the
  shadow) and added `in-data-[slot=dialog-content]:border-none` so the root
  border doesn't double the dialog's ring.
- `command-input`: removed the stray `focus-within:` fragment and the
  `h-8!`/`rounded-lg!`/`shadow-none!` overrides — plain `h-8` suffices
  (nothing to fight on the InputGroup root) and the radius override was a
  no-op under the collapsed 4px radius tokens. Kept the addon `pl-2!`
  (parent→child variant, tw-merge can't resolve it).
- `command-item`: removed the no-op `in-data-[slot=dialog-content]:rounded-lg!`.

## Round 8 — destructive item focus fill (open question 6)

Bar variants on the dropdown's Delete item: A neutral `bg-muted/10` fill
with red text (round-1 lock) vs B faint `bg-error/5` tint behind red text.

- **Verdict — LOCKED: B.** Destructive menu items focus with `bg-error/5`
  behind `text-error` (amends the round-1 neutral-fill call; the fill is
  itself meaning-bearing here, consistent with P1).

## Round 9 — alert-dialog footer alignment (user-reported)

The `sm`-size alert dialog laid its footer out as `grid grid-cols-2`,
stretching buttons into half-width cells that read as misaligned. Replaced
both size variants with the shared footer pattern (drawer/dialog
consistency): full-width stacked `flex-col-reverse` below `sm`,
right-aligned row from `sm` up. Dropped the unreferenced
`cn-alert-dialog-footer` marker class.

## Verdict

- **Motion (open question 1 + 7): resolved.** The overlay family animates
  via `src/lib/components/ui/overlay-motion/` — "slingshot light"
  character: directional entry with a slight backOut overshoot, quick
  fade exits, scrim plain fade. Select included; drawer keeps vaul's
  motion at 300ms. Iteration history in `history/round-{1,2,3}-*.ts`.
- Remaining open questions (2–6: scrim, drawer background, overlay
  chrome/shadow, command internals, destructive focus fill) still pending
  their own rounds.
