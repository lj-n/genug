# PROTOTYPE NOTES — #354 dark accent token retune

Variant switch on the live app (`prototype-token-switcher.svelte`, dev-only in root layout).
Contrast constraints (dark): text on `surface-high` ≥ 4.5; `/10` chip composites over
`surface` and `surface-high` ≥ 4.5. Ticket's literal bar omits chip-on-`surface-high`,
but that's where dialog default-variant buttons sit.

## Round 1

- A current (fails, worst 3.07): `#a97bbb / #6d9cb1 / #7e9a65`
- B ticket floor (chip-on-high still 3.9): `#c091d2 / #79a9be / #8eab75`
- C safe everywhere, same chroma (worst 4.55): `#d0a0e3 / #89b9ce / #9dbb84`
- D pastel toward error/focus family (worst 5.4): `#dbb8e8 / #a7cad9 / #b5cba3`

## Round 2

User asked for C+D combined → slot B replaced with OKLab-midpoint hybrid
(worst composite 4.98): info `#d6ace6`, interactive `#98c1d4`, success `#a9c394`.
Old B snapshotted in `history/round-1-prototype-token-switcher.svelte`.
