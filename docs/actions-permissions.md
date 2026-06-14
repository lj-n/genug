# Actions & Permissions

## Actions class

`src/lib/server/db/actions/index.ts`

`Actions` is instantiated once per request with `{ database, user }`. It exposes domain namespaces:

```typescript
class Actions {
	account      // createAccountActions(...)
	budget       // createBudgetActions(...)
	category     // createCategoryActions(...)
	transaction  // createTransactionActions(...)
	user         // createUserActions(...)
}
```

Each namespace is created by a factory function (e.g. `createBudgetActions({ database, user })`), which returns an object of methods scoped to the authenticated user.

## Using actions in remote functions

```typescript
import { actions } from '$db';
import { requireUser } from './remote.utils';

export const getBudgets = query(async () => {
	const [user] = requireUser();
	return actions.budget.getAllBudgets({ userId: user.id });
});
```

## requireUser

`src/lib/remote-functions/remote.utils.ts`

```typescript
const [user] = requireUser();
```

Returns `[user: App.User]` as a tuple, or throws an HTTP 401 error if no valid session exists. This is the replacement for the old `withPermissions` HOF pattern.

## userHasPermission

```typescript
userHasPermission({ budgetIdCol, database, userId })
```

Returns a Drizzle `exists()` subquery that checks whether `userId` has a non-INVITEE role in `usersToBudgets` for the given `budgetIdCol`. Used inside action methods to scope queries to budgets the user actually belongs to.

## Route-level vs function-level protection

Route level:
- `+page.server.ts` uses `actions` directly for lightweight loads (e.g. checking `isFirstUser`).
- No `withPermissions` wrapper — auth is handled downstream.

Function level:
- Remote functions use `requireUser()` for auth.
- Domain actions use `userHasPermission()` for budget-scoped authorization.
