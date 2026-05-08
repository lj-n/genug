Added transaction table/pagination translation keys to both EN and DE message catalogs, keeping existing key order and JSON formatting intact.

Paraglide type errors for new keys cleared after recompiling with `npm exec paraglide-js -- compile --project ./project.inlang --outdir ./src/lib/paraglide --emit-ts-declarations`.

4: Paraglide-generated index exports must stay in sync with newly added message files; recompiling the catalog resolved missing `m.transactions_*` symbols.
