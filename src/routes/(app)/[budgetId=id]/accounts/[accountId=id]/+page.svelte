<script lang="ts">
	import type { TableParams } from '$lib/components/features/transaction';

	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { AccountBalances, AccountSetName } from '$lib/components/features/account';
	import { TableState, TransactionTable } from '$lib/components/features/transaction';
	import * as Page from '$lib/components/ui/page';
	import { Separator } from '$lib/components/ui/separator';
	import { getAccount, getAccountBalances } from '$lib/remote-functions/account.remote';
	import { getBudget } from '$lib/remote-functions/budget.remote';
	import { listTransactions } from '$lib/remote-functions/transaction.remote';
	import { TransactionsURLParamsSchema } from '$lib/schemas/transaction';
	import * as v from 'valibot';

	import type { PageProps } from './$types';

	let { params }: PageProps = $props();

	const account = $derived(await getAccount(params.accountId));
	const balanceDetail = $derived(await getAccountBalances(params.accountId));
	const budget = $derived(await getBudget(params.budgetId));

	const balances = $derived({
		balance: account.balance,
		pending: balanceDetail.pending,
		validated: balanceDetail.validated
	});

	function parseURLParams({ searchParams }: URL) {
		return v.parse(TransactionsURLParamsSchema, {
			categoryId: searchParams.getAll('categoryId'),
			notes: searchParams.get('notes'),
			page: searchParams.get('page'),
			pageSize: searchParams.get('pageSize'),
			sortAmount: searchParams.get('sortAmount'),
			sortCategory: searchParams.get('sortCategory'),
			sortDate: searchParams.get('sortDate'),
			sortValidated: searchParams.get('sortValidated')
		});
	}

	function buildSearch(tableParams: TableParams) {
		// Deliberately not SvelteURLSearchParams: buildSearch runs inside the URL
		// bridge $effect, and mutating a reactive object there makes the effect
		// self-invalidating (effect_update_depth_exceeded).
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const searchParams = new URLSearchParams();
		for (const id of tableParams.categoryId) searchParams.append('categoryId', id);
		if (tableParams.notes) searchParams.set('notes', tableParams.notes);
		if (tableParams.page !== 1) searchParams.set('page', String(tableParams.page));
		if (tableParams.pageSize !== 15) searchParams.set('pageSize', String(tableParams.pageSize));
		if (tableParams.sortAmount) searchParams.set('sortAmount', tableParams.sortAmount);
		if (tableParams.sortCategory) searchParams.set('sortCategory', tableParams.sortCategory);
		if (tableParams.sortDate) searchParams.set('sortDate', tableParams.sortDate);
		if (tableParams.sortValidated) searchParams.set('sortValidated', tableParams.sortValidated);
		return searchParams.toString();
	}

	const tableState = new TableState(parseURLParams(page.url));

	const result = $derived(
		await listTransactions({ accountId: params.accountId, ...tableState.params })
	);

	$effect(() => {
		const nextQuery = buildSearch(tableState.params);
		if (nextQuery === page.url.searchParams.toString()) return;
		goto(
			resolve(`/(app)/[budgetId=id]/accounts/[accountId=id]?${nextQuery}`, {
				accountId: params.accountId,
				budgetId: params.budgetId
			}),
			{ keepFocus: true, noScroll: true }
		);
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

		<TransactionTable
			accountId={params.accountId}
			budgetId={params.budgetId}
			currency={budget.currency}
			pagination={{
				page: result.pagination.page,
				pageSize: result.pagination.pageSize,
				total: result.pagination.totalTransactionCount
			}}
			{tableState}
			transactions={result.transactions}
		/>
	</Page.Content>
</Page.Root>
