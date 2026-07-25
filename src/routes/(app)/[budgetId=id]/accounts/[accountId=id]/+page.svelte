<script lang="ts">
	import type { TableParams } from '$lib/components/features/transaction';

	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import {
		AccountArchivedNotice,
		AccountBalances,
		AccountSettings
	} from '$lib/components/features/account';
	import { TableState, TransactionTable } from '$lib/components/features/transaction';
	import * as Page from '$lib/components/ui/page';
	import { Separator } from '$lib/components/ui/separator';
	import { getAccount, getAccountBalances } from '$lib/remote-functions/account.remote';
	import { getBudget } from '$lib/remote-functions/budget.remote';
	import { listTransactions } from '$lib/remote-functions/transaction.remote';
	import { TransactionsURLParamsSchema } from '$lib/schemas/transaction';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import { currentMonth, toParam } from '$lib/utils/month';
	import { stickyParam } from '$lib/utils/sticky-param';
	import * as v from 'valibot';

	import type { PageProps } from './$types';

	let { params }: PageProps = $props();

	const budgetId = getBudgetId();
	const accountId = stickyParam(() => params.accountId);

	const account = $derived(await getAccount(accountId()));
	const balanceDetail = $derived(await getAccountBalances(accountId()));
	const budget = $derived(await getBudget(budgetId()));

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

	const result = $derived(await listTransactions({ accountId: accountId(), ...tableState.params }));

	$effect(() => {
		const nextQuery = buildSearch(tableState.params);
		if (nextQuery === page.url.searchParams.toString()) return;
		goto(
			resolve(`/(app)/[budgetId=id]/accounts/[accountId=id]?${nextQuery}`, {
				accountId: accountId(),
				budgetId: budgetId()
			}),
			{ keepFocus: true, noScroll: true }
		);
	});
</script>

<Page.Root>
	<Page.Header class="flex-row flex-wrap items-center justify-between gap-4">
		<Page.Title>
			{account.name}
		</Page.Title>

		{#if !account.archivedAt}
			<AccountSettings
				accountId={accountId()}
				onArchived={() =>
					goto(resolve('/(app)/[budgetId=id]/accounts/archived', { budgetId: budgetId() }))}
				onDeleted={() =>
					goto(
						resolve('/(app)/[budgetId=id]/[month=month]', {
							budgetId: budgetId(),
							month: toParam(currentMonth())
						})
					)}
			/>
		{/if}
	</Page.Header>

	<Page.Content>
		{#if account.archivedAt}
			<AccountBalances {balances} currency={budget.currency} />

			<Separator orientation="horizontal" />

			<AccountArchivedNotice accountId={accountId()} />
		{:else}
			<TransactionTable
				accountId={accountId()}
				budgetId={budgetId()}
				currency={budget.currency}
				pagination={{
					page: result.pagination.page,
					pageSize: result.pagination.pageSize,
					total: result.pagination.totalTransactionCount
				}}
				{tableState}
				transactions={result.transactions}
			>
				{#snippet accountBalances()}
					<AccountBalances {balances} currency={budget.currency} />
				{/snippet}
			</TransactionTable>
		{/if}
	</Page.Content>
</Page.Root>
