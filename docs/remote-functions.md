# Remote Function Conventions

- Remote functions are the default mutation and query layer. Before adding `+server.ts`, check whether the feature belongs in `src/lib/remote-functions/*.remote.ts`.
- Group functions by domain: `budget.remote.ts`, `account.remote.ts`, `transaction.remote.ts`, etc.
- Use `guardedQuery`, `guardedForm`, and `guardedCommand` for authenticated work instead of rebuilding login handling.
- Keep remote functions orchestration-focused: validate input, call the relevant auth or `user-context` logic, and shape the response.
- Business rules stay out of remote functions. Authorization and domain logic belong in `src/lib/server/db/user-context` or `src/lib/server/db/auth`.
- Reuse existing remote form ergonomics: `.enhance(...)`, `.for(...)`, `.fields.*`, `.issues()`, `.allIssues()`.
- Keep user-facing text localized through Paraglide message helpers.
