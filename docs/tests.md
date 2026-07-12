# Test Conventions

- Keep tests close to the code they verify.
- For database-heavy tests, prefer fresh in-memory databases via `createDatabase(':memory:')` and existing helpers from `src/test/fixtures.ts`.
- Seed only what the test needs. Existing fixtures are intentionally small and direct.
- Test business behavior at the auth and `user-context` layers — that is where access control and persistence rules live.
- Extend colocated tests such as `budget.test.ts`, `account.test.ts`, and `transaction.test.ts` instead of moving domain tests elsewhere.
- End-to-end tests live in `tests/playwright`.
- Reuse and extend the page-object model under `tests/playwright/pom`.
- Respect the serial bootstrap flow in `tests/playwright/global.setup.ts`, including first-user and admin setup behavior.
- Prefer user-visible assertions around navigation, forms, dialogs, and data changes over implementation-detail assertions.
- The Playwright dev server defaults to port 3000. Set `E2E_PORT` to run against an isolated server/database — required when several worktrees run `npm run test:e2e` at once, otherwise they collide on the same port. Example: `E2E_PORT=3247 npm run test:e2e`.
