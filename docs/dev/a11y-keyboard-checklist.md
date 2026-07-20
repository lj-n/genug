# Keyboard-accessibility checklist — core flows

Manual keyboard pass for the core flows, per ADR-0016 (accessibility gated on the
core flows at WCAG 2.1 AA). axe covers names, roles, and labels automatically; it
cannot judge focus order, traps, or completability, so those are checked here.

The **transaction create/edit/validate row** — the one flow where keyboard order
genuinely breaks — is covered by an automated keyboard-only test in
`tests/playwright/a11y.spec.ts` ("Transaction create row is completable by
keyboard alone"). The simpler flows below are verified manually and recorded here.

## What "pass" means

- Every step reachable with `Tab`/`Shift+Tab`; no control skipped or trapped.
- The focused control always shows the visible focus treatment (`border-focus` +
  ring — the `--color-focus` token now meets the 3:1 non-text bar in both themes).
- The flow completes with `Enter` (submit) and unwinds with `Escape` (dismiss),
  returning focus to a sensible place.

## Results — verified 2026-07-17 (chromium, light theme)

| Flow                                             | Keyboard path                                                                                                                       | Result                                           |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **Login**                                        | focus Username → type → `Tab` to Password → type → `Enter`                                                                          | ✅ submits, lands authenticated                  |
| **Add account**                                  | `Enter` on the add-account trigger → type name → `Enter`                                                                            | ✅ dialog opens focused, submits, closes         |
| **Add category**                                 | `Enter` on the create-category trigger → type name → `Enter`                                                                        | ✅ dialog opens focused, submits, closes         |
| **Assign money**                                 | focus a category's Budget button → `Enter` → type amount → `Enter`                                                                  | ✅ popover opens with the input focused, commits |
| **View month**                                   | month navigator prev/next and the category-detail triggers are `<button>`/`<a>` in tab order with discernible names (axe-confirmed) | ✅ reachable                                     |
| **Add transaction / transfer / edit / validate** | inline row, `Tab` across fields, `Enter` submits                                                                                    | ✅ automated (see above)                         |

Re-run the automated portion with:

```bash
npm run test:e2e -- tests/playwright/a11y.spec.ts
```
