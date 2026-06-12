<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { AccountBalances } from '$lib/components/account';
	import { Button } from '$lib/components/ui/button';
	import * as Page from '$lib/components/ui/page';
	import { Separator } from '$lib/components/ui/separator';
	import { m } from '$lib/paraglide/messages';
	import { getAccountBalanceDetail, getAccountById } from '$lib/remote-functions/account.remote';
	import { getBudget } from '$lib/remote-functions/budget.remote';
	import PhChartLineUp from '~icons/ph/chart-line-up';

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
	<Page.Header class="flex-row justify-between gap-4">
		<Page.Title>
			{account.name}
		</Page.Title>

		<Button
			variant="ghost"
			href={resolve('/(app)/[budgetId=id]/accounts/[accountId=id]/detail', {
				accountId,
				budgetId
			})}
		>
			<PhChartLineUp class="size-6 text-muted" />
			{m.account_details()}
		</Button>
	</Page.Header>

	<Page.Content>
		<AccountBalances {balances} currency={budget.currency} />

		<Separator orientation="horizontal" />

		<Table {accountId} {budgetId} />
	</Page.Content>
</Page.Root>
