# README Screenshots

The README embeds two screenshots — the budget month view and an account's
transactions — living in `../screenshots/`. They are captured from a
deterministic demo fixture, not a live instance.

## Regenerating

Run after notable UI changes to the budget month view or the transactions
table, then commit the updated PNGs:

```bash
npm run screenshots
```

`scripts/screenshot.ts` builds the app, seeds a throwaway SQLite database via
`scripts/seed.ts` (direct `user-context` calls — see ADR/CONTEXT on where
business rules live), boots the production server, logs in, and writes the
PNGs. Reproducibility is the kept-current mechanism: this is **not** wired into
the CI gate, so the images are only as fresh as the last commit of them.

## Changing the fixture

Edit `scripts/seed.ts`. It is authored as plain data (accounts, categories with
target balances, one deliberately-overspent category, transactions across the
current month). Keep it deterministic — no random data — so screenshots only
change when the UI or the fixture does. All transactions are dated within the
current month, so the budget view always shows live activity whenever you
regenerate.
