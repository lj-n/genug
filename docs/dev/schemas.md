# Schema Conventions

- Validation schemas live in `src/lib/schemas`.
- Use Valibot consistently and match the composition style already used in the repository.
- Reuse shared schema fragments such as `NameSchema`, `BudgetIdSchema`, and related `.entries` instead of duplicating field rules.
- Group input contracts by domain: account schemas in `account.ts`, auth schemas in `auth.ts`, etc.
- Prefer extending existing schema modules before creating new schema files with overlapping responsibilities.
