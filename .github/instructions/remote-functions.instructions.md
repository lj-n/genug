---
applyTo: "src/lib/remote-functions/**/*.ts"
---

# Remote function instructions

- Remote functions are the default mutation and query layer. Before adding `+server.ts`, first check whether the feature belongs in `src/lib/remote-functions/*.remote.ts`.
- Group functions by domain. Keep budget logic in `budget.remote.ts`, account logic in `account.remote.ts`, transaction logic in `transaction.remote.ts`, and so on.
- Use `guardedQuery`, `guardedForm`, and `guardedCommand` for authenticated work instead of rebuilding login handling.
- Keep remote functions orchestration-focused: validate input, call the relevant auth or `user-context` logic, and shape the response.
- Keep business rules out of remote functions. Authorization and domain logic belong in `src/lib/server/db/user-context` or `src/lib/server/db/auth`.
- Reuse existing remote form ergonomics such as `.enhance(...)`, `.for(...)`, `.fields.*`, `.issues()`, and `.allIssues()`.
- When adding new user-facing behavior, keep visible text localized through Paraglide message helpers.
