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
- CI runs Playwright with one retry and `failOnFlakyTests`: a test that only passes on retry fails the run. Fix the flake at its cause; do not raise timeouts or retries.

## Diagnosing flakes

- **Interact only after hydration.** A click that lands between first paint and hydration is swallowed by client-only controls, and a submit posts natively, so client-only effects (dialogs, toggles) never run. The `page` fixture in `tests/playwright/fixture.ts` waits for SvelteKit's `#svelte-announcer` after every `goto`, `reload`, `goBack` and `goForward`, so a test can click right after navigating. Import `test` from `./fixture`, never from `@playwright/test`; ESLint enforces this.
- **Full page loads triggered by a click** (a native form post, a reload caused by the app) are not covered by the wrapper. Call `waitForHydration(page)` from `./fixture` before the next interaction.
- **Opting out.** A test that must act before hydration uses `test.use({ waitForHydration: false })` with a one-line comment giving the reason. Tests with `javaScriptEnabled: false` skip the wait automatically.
- **Reproduce under load.** Flakes often only appear when the whole suite runs in parallel, not in an isolated run. Repeat the full suite: `E2E_PORT=3247 npm run test:e2e -- --repeat-each=3`, or raise `N` in `--repeat-each=N` for a single spec once you have a suspect.
- **Widen race windows.** `E2E_REMOTE_DELAY=<ms>` holds every remote-function request (`/_app/remote/**`) for that long, which makes timing bugs around pending queries and form submits reproducible: `E2E_REMOTE_DELAY=300 npm run test:e2e -- tests/playwright/admin.spec.ts --repeat-each=10`. It is off when unset and never set in CI.
