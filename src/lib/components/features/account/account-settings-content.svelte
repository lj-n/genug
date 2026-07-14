<script lang="ts">
	import { getAccount } from '$lib/remote-functions/account.remote';
	import { getBudget } from '$lib/remote-functions/budget.remote';

	import AccountArchive from './account-archive.svelte';
	import AccountDelete from './account-delete.svelte';
	import AccountEdit from './account-edit.svelte';

	let {
		accountId,
		onArchived,
		onDeleted
	}: { accountId: string; onArchived: () => void; onDeleted: () => void } = $props();

	const account = $derived(await getAccount(accountId));
	const budget = $derived(await getBudget(account.budgetId));
	const currency = $derived(budget.currency);
</script>

<div class="@container grid gap-6 @3xl:grid-cols-2">
	<AccountEdit {account} />

	<AccountArchive {account} {currency} {onArchived} />

	<AccountDelete {account} {onDeleted} />
</div>
