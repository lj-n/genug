# Palette prototype notes (#256)

PROTOTYPE — throwaway, delete with `palette-prototype.svelte` /
`palette-prototype-schemes.ts` when the ticket closes.

**Question:** which base16 scheme is the base for the app default palette, and
what is the personal adaptation? Judged live on the reference screen (budget
month view, design language per #255), light AND dark, via
`?variant=current|a|b|c|d|e` and the floating bar.

## Round 1 shortlist

- `current` — today's tokens (Rosé Pine dark + hand-adapted warm light) as
  baseline. Note: today's values are NOT a strict base16 mapping (custom green
  success, darker gold focus in light).
- **A** — Rosé Pine dawn/main, _strict_ #181 slot mapping. Differs from
  `current`: success becomes pine (teal-blue `#31748f`/`#286983` — the scheme
  has no green in base0B), info becomes foam.
- **B** — Flexoki light/dark. Warm paper-and-ink, closest in spirit to today's
  cream light mode; real green/blue accents.
- **C** — Everforest light/dark medium. Soft warm green-leaning; flatters the
  green wordmark.
- **D** — Catppuccin latte/mocha. Popular cool pastel counterpoint. Beware:
  base01 is _darker_ than base00 in both variants, so row slabs render darker
  than the page background (inverted vs today).
- **E** — Gruvbox Material light/dark medium. Warm retro, pixel-art-friendly;
  strongly yellow light background.

Also check per candidate: pixel-art logo + `text-success` wordmark on the new
backgrounds (out of scope to change, must still sit well).

## Feedback rounds

<!-- appended per round: liked / disliked / slots replaced and why -->

**Round 2 (rebuild on user feedback):** 5 fixed slots were too few — replaced
the `?variant=a..e` slot model with the FULL tinted-theming catalog (330
schemes, generated into `palette-prototype-catalog.ts` by
`scratchpad/gen-catalog.mjs`). Light and dark schemes now picked independently
(`?light=<slug>&dark=<slug>`, `current` = today's tokens), selects have a
Popular optgroup (~48 curated slugs) above the full list; ←/→ cycles Popular
for whichever mode is showing; `?` opens a token legend (token → slot →
resolved hex → where it appears in the app). User also asked how tokens map —
see legend + the ANSI note in it.

**Round 3 (winner pair + adaptation):** user picked **light = One Light,
dark = Kanagawa Dragon**. Contrast audit of the upstream palettes against the
10-token map found: muted (base03) unreadable as UI text in both (2.5:1 /
2.8:1 vs today's ~5:1); One Light's success 3.1:1, info 4.0:1, interactive
3.9:1 all below AA for their text uses; One Light's base01 slabs _darker_ than
the page (inverted vs the app's paper look); Kanagawa Dragon's base09 focus
too washed for "gold means keyboard". Authored personal variants
`one-light-genug` / `kanagawa-dragon-genug` (see `personal` in
`palette-prototype-schemes.ts`, per-slot rationale in comments) and added a
"Personal" optgroup so upstream ↔ adapted can be A/B-ed in place.

## Finding for #180/#187 (beyond this ticket)

The strict `muted→base03` map breaks for arbitrary user-chosen schemes:
catalog-wide audit (332 schemes, contrast vs base00): base03 ≥4.5:1 in only
12%, ≥3:1 in 40%; base04 ≥4.5:1 in 66%. base16 designs base03 as faint editor
comments, but genug uses `muted` for real text. Recommendation for the PRD
(#187, amending #181's map): a resolve-time readability guard — `muted` =
base04 if ≥~4.5:1 vs base00, else base03 if it passes, else derived by mixing
base05 toward base00 to the target. Alternatives considered: scheme-faithful
values + per-slot editor (terminals do this; gallery would look broken for
most schemes), or contrast badges on gallery cards. The app-default scheme is
unaffected (authored with readable base03 — the personal adaptation).

## Verdict

<!-- winner, rationale, the personal adaptations, open questions -->

Pending user confirmation of the adapted pair:

- **Base schemes:** One Light (light) + Kanagawa Dragon (dark), from
  tinted-theming spec-0.11.
- **Personal adaptation (light, `one-light-genug`):** base01 #fdfdfd, base02
  #ffffff (slabs/overlays lighter than page, not darker); base03 #696c77
  (muted readable, 5.0:1); base0B #448f43, base0C #01749f, base0D #2f63d8
  (accent text AA-safe); base04 takes upstream's #a0a1a7.
- **Personal adaptation (dark, `kanagawa-dragon-genug`):** base03 #8a847e
  (muted readable, 4.9:1); base09 #d4a96f (gold focus ring, carpYellow-leaning).
- Logo + wordmark verified on both backgrounds (screenshots in session).
