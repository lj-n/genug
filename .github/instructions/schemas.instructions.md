---
applyTo: "src/lib/schemas/**/*.ts"
---

# Schema instructions

- Validation schemas live in `src/lib/schemas`.
- Use Valibot consistently and match the composition style already used in the repository.
- Reuse shared schema fragments such as `NameSchema`, `BudgetIdSchema`, and related `.entries` instead of duplicating field rules.
- Keep input contracts grouped by domain, for example account schemas in `account.ts` and auth schemas in `auth.ts`.
- Prefer extending existing schema modules before creating new schema files with overlapping responsibilities.
