# Remote Function Conventions

- Remote functions are the default mutation and query layer. Before adding `+server.ts`, check whether the feature belongs in `src/lib/remote-functions/*.remote.ts`.
- Group functions by domain: `budget.remote.ts`, `account.remote.ts`, `transaction.remote.ts`, etc.
- Use `guardedQuery`, `guardedForm`, and `guardedCommand` for authenticated work instead of rebuilding login handling.
- Remote functions are **mechanical adapters** (see ADR-0002). They may: guard auth, validate input, translate form semantics to DB semantics (missing field vs. cleared field), redirect, and refresh query caches. Nothing else.
- Litmus test: **if a remote function produces a value instead of passing one through or translating it, that value belongs in `user-context`.** Defaults, normalization rules, and eligibility checks are business rules — put them in `src/lib/server/db/user-context` or `src/lib/server/db/auth`.
- Server load functions are peer adapters, not bypasses: they may call `createUserCtx()` directly, but must check `locals.session` themselves.
- The adapter layer is deliberately test-free. Tests target `user-context`; Playwright covers the wiring. If an adapter seems to need a unit test, it holds logic that should move down.
- Reuse existing remote form ergonomics: `.enhance(...)`, `.for(...)`, `.fields.*`, `.issues()`, `.allIssues()`.
- Keep user-facing text localized through Paraglide message helpers.
