<script lang="ts">
	import { page } from '$app/state';
	import { AccountBalances, AccountSetName } from '$lib/components/account';
	import * as Page from '$lib/components/ui/page';
	import { Separator } from '$lib/components/ui/separator';
	import { getAccountBalanceDetail, getAccountById } from '$lib/remote-functions/account.remote';
	import { getBudget } from '$lib/remote-functions/budget.remote';

	import Table from './table.svelte';

	const accountId = $derived(page.params.accountId!);
	const budgetId = $derived(page.params.budgetId!);

	const account = $derived(await getAccountById({ accountId }));
	const balanceDetail = $derived(await getAccountBalanceDetail({ accountId }));
	const budget = $derived(await getBudget({ budgetId }));

	const balances = $derived({
		balance: account.balance,
		pending: balanceDetail.pending,
		validated: balanceDetail.validated
	});
</script>

<Page.Root>
	<Page.Header class="flex-row items-center justify-between gap-4">
		<Page.Title>
			{account.name}
		</Page.Title>

		<AccountSetName {accountId} />
	</Page.Header>

	<Page.Content>
		<AccountBalances {balances} currency={budget.currency} />

		<Separator orientation="horizontal" />

		<Table {accountId} {budgetId} />
	</Page.Content>
</Page.Root>
