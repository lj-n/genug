---
applyTo: "src/**/*.test.ts,src/**/*.spec.ts,tests/playwright/**/*.ts"
---

# Test instructions

- Keep tests close to the code they verify.
- For database-heavy tests, prefer fresh in-memory databases via `createDatabase(':memory:')` and existing helpers from `src/test/fixtures.ts`.
- Seed only what the test needs. Existing fixtures are intentionally small and direct.
- Test business behavior at the auth and `user-context` layers, because that is where access control and persistence rules live.
- Extend colocated tests such as `budget.test.ts`, `account.test.ts`, and `transaction.test.ts` instead of moving domain tests elsewhere.
- End-to-end tests live in `tests/playwright`.
- Reuse and extend the page-object model under `tests/playwright/pom`.
- Respect the serial bootstrap flow in `tests/playwright/global.setup.ts`, including first-user and admin setup behavior.
- Prefer user-visible assertions around navigation, forms, dialogs, and data changes over implementation-detail assertions.
