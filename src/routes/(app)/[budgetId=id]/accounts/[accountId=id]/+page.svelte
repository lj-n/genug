<script lang="ts">
	import { AccountBalances, AccountSetName } from '$lib/components/features/account';
	import * as Page from '$lib/components/ui/page';
	import { Separator } from '$lib/components/ui/separator';
	import { getAccount, getAccountBalances } from '$lib/remote-functions/account.remote';
	import { getBudget } from '$lib/remote-functions/budget.remote';

	import type { PageProps } from './$types';

	import Table from './table.svelte';

	let { params }: PageProps = $props();

	const accountQuery = $derived(getAccount(params.accountId));
	const balancesQuery = $derived(getAccountBalances(params.accountId));
	const budgetQuery = $derived(getBudget(params.budgetId));
</script>

<Page.Root>
	<Page.Header class="flex-row items-center justify-between gap-4">
		<Page.Title>
			{(await accountQuery).name}
		</Page.Title>

		<AccountSetName accountId={params.accountId} />
	</Page.Header>

	<Page.Content>
		{@const balanceDetail = await balancesQuery}
		<AccountBalances
			balances={{
				balance: (await accountQuery).balance,
				pending: balanceDetail.pending,
				validated: balanceDetail.validated
			}}
			currency={(await budgetQuery).currency}
		/>

		<Separator orientation="horizontal" />

		<Table
			accountId={params.accountId}
			budgetId={params.budgetId}
			currency={(await budgetQuery).currency}
		/>
	</Page.Content>
</Page.Root>
