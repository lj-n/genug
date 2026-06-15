# Routes

## Structure

```
src/routes/
├── (app)/                        # Protected route group (requires session)
│   ├── +layout.server.ts         # Shared load (user, budgets)
│   ├── +page.svelte              # Dashboard / budget list
│   ├── [budgetId=id]/            # Budget detail
│   │   ├── [month=month]/        # Monthly budget view
│   │   │   ├── +page.server.ts   # Load only (data from remote functions)
│   │   │   └── +page.svelte
│   │   ├── accounts/
│   │   │   ├── [accountId=id]/   # Account detail with transactions table
│   │   │   └── new/              # Create account standalone page
│   │   ├── categories/
│   │   │   ├── [categoryId=id]/  # Category detail
│   │   │   └── new/              # Create category
│   │   └── transactions/
│   ├── admin/                    # Admin panel
│   ├── new/                      # Create budget
│   └── settings/                 # User settings
└── login/                        # Public auth
    └── first/                    # First-user registration
```

## Param matchers

Custom matchers in `src/params/`:

- `[budgetId=id]` — matches the `id` format (used for budget IDs)
- `[month=month]` — matches `YYYYMM` integer format

Matchers validate the segment before the route renders, returning 404 for invalid formats.

## Protection pattern

Routes are unprotected by default at the layout level. Protection happens in **remote functions** via `requireUser()`:

```typescript
// src/lib/remote-functions/budget.remote.ts
export const getBudgets = query(async () => {
	const [user] = requireUser();
	return actions.budget.getAllBudgets({ userId: user.id });
});
```

`+page.server.ts` files are kept lightweight — they do shared data loading (e.g. layouts) but no form handling. All mutations go through remote functions.

## Forms & mutations

All form submissions and data mutations use remote functions via `$app/server`:

- `form(Schema, handler)` for mutations
- `query(Schema, handler)` for reads
- Defined in `src/lib/remote-functions/*.remote.ts`
