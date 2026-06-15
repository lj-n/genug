<script lang="ts">
	import { AccountBalances, AccountSetName } from '$lib/components/account';
	import * as Page from '$lib/components/ui/page';
	import { Separator } from '$lib/components/ui/separator';
	import { getAccount, getAccountBalances } from '$lib/remote-functions/account.remote';
	import { getBudget } from '$lib/remote-functions/budget.remote';

	import type { PageProps } from './$types';

	import Table from './table.svelte';

	let { params }: PageProps = $props();

	const account = $derived(await getAccount(params.accountId));
	const balanceDetail = $derived(await getAccountBalances(params.accountId));
	const budget = $derived(await getBudget(params.budgetId));

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

		<AccountSetName accountId={params.accountId} />
	</Page.Header>

	<Page.Content>
		<AccountBalances {balances} currency={budget.currency} />

		<Separator orientation="horizontal" />

		<Table accountId={params.accountId} budgetId={params.budgetId} />
	</Page.Content>
</Page.Root>
