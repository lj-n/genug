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

## Verdict

<!-- winner, rationale, the personal adaptations, open questions -->
