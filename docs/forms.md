# Forms

Forms use **Valibot schemas** + **SvelteKit remote functions** (`form()` from `$app/server`).

## Schema pattern

`src/lib/schemas/account.ts` as example:

```typescript
import * as v from 'valibot';
import { NameSchema } from './utils';

export const AccountCreateSchema = v.object({
	...BudgetIdSchema.entries,
	accountName: NameSchema,
	startingBalance: v.optional(v.number(), 0)
});
```

## Remote function pattern

`src/lib/remote-functions/account.remote.ts`:

```typescript
export const createAccount = form(
	AccountCreateSchema,
	async ({ accountName, budgetId, startingBalance }) => {
		const [user] = requireUser();
		const account = actions.account.createAccount({
			data: { budgetId, name: accountName, notes: m.account_create_starting_balance() },
			startingBalance,
			userId: user.id
		});
		redirect(
			303,
			resolve('/(app)/[budgetId=id]/accounts/[accountId=id]', { accountId: account.id, budgetId })
		);
	}
);
```

## Client usage

```svelte
<script lang="ts">
	import { createAccount } from '$lib/remote-functions/account.remote';

	let { budgetId }: { budgetId: string } = $props();
	const form = $derived(createAccount.for(budgetId));
</script>

<form {...form}>
	<input {...form.fields.accountName.as('text')} />
	<button type="submit">Submit</button>
</form>
```

## Key concepts

- **`form(Schema, handler)`** — creates a form with Valibot validation. First arg: schema (omit for no validation). Returns an object with `.for(...)` (pre-fill defaults), `.fields.*.as(type)`, `.fields.*.value()`, `.fields.*.set(v)`, `.fields.allIssues()`.
- **`query(handler)` / `query(Schema, handler)`** — read-only data fetching. `.batch()` variant for per-param caching.
- **`requireUser()`** — from `$lib/remote-functions/remote.utils.ts`. Returns `[user]` or throws 401. Replaces old `withPermissions` pattern.
- **Numeric fields** — use `field.as('number').name` for auto-coercion.
- **Hidden fields** — `<input {...field.as('hidden', value)} />`.
- **Form errors** — `{#each form.fields.allIssues() as issue (issue)}<p class="text-error">{issue.message}</p>{/each}`
- **Programmatic submit** — `form.enhance(async (f) => { await f.submit(); })`.
- **Select fields** — use `field.as('select').name` for the name, `field.value() ?? defaultValue` for binding.
- **Unique form IDs** — `$props.id()` for scoped form IDs per component instance.
