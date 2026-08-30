<script lang="ts">
	import type { TableParams } from '$lib/components/features/transaction';

	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { AccountArchivedNotice, AccountBalances } from '$lib/components/features/account';
	import {
		pruneForeignCategoryIds,
		TableState,
		TransactionTable
	} from '$lib/components/features/transaction';
	import { Button } from '$lib/components/ui/button';
	import * as Page from '$lib/components/ui/page';
	import { m } from '$lib/paraglide/messages';
	import { getAccount, getAccountBalances } from '$lib/remote-functions/account.remote';
	import { getBudget } from '$lib/remote-functions/budget.remote';
	import { getCategories } from '$lib/remote-functions/category.remote';
	import { listTransactions } from '$lib/remote-functions/transaction.remote';
	import { TransactionsURLParamsSchema } from '$lib/schemas/transaction';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import { stickyParam } from '$lib/utils/sticky-param';
	import { untrack } from 'svelte';
	import * as v from 'valibot';
	import GearSixIcon from '~icons/ph/gear-six';

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

	// Read tracked so filter hydration waits for the list; it is stable per budget,
	// so pruning adds no table rebuild beyond the account switch below (#371/#372).
	const knownCategoryIds = $derived(
		new Set((await getCategories({ budgetId: budgetId() })).map((c) => c.id))
	);

	// One table state per account. The route component is shared across all
	// account pages and reused on navigation, so a single state object would carry
	// account A's filters onto account B and the URL bridge below would stamp those
	// stale params onto B's clean URL (#371). Rebuild it whenever the account
	// changes. The intermediate derived only *changes value* on a real switch, so
	// query-only navigations (in-page filter/sort/page changes) keep the instance
	// instead of fighting the URL bridge. The URL is read untracked, so a full
	// load or reload still hydrates from it (deep links).
	const currentAccountId = $derived(accountId());
	const tableState = $derived.by(() => {
		const _accountId = currentAccountId;
		const params = untrack(() => parseURLParams(page.url));
		params.categoryId = pruneForeignCategoryIds(params.categoryId, knownCategoryIds);
		return new TableState(params);
	});

	const result = $derived(await listTransactions({ accountId: accountId(), ...tableState.params }));

	// The archived⇄active branch decision reads the register's queries through
	// this one object, so restoring in place never introduces a first-time
	// await mid-update — that leaves the fragment permanently blank in
	// production builds.
	const view = $derived({
		archived: account.archivedAt !== null,
		balances,
		result
	});

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
			<Button
				variant="ghost"
				size="icon"
				href={resolve('/(app)/[budgetId=id]/accounts/[accountId=id]/settings', {
					accountId: accountId(),
					budgetId: budgetId()
				})}
			>
				<GearSixIcon />
				<span class="sr-only">{m.account_settings_title()}</span>
			</Button>
		{/if}
	</Page.Header>

	<Page.Content>
		{#if view.archived}
			<!-- An archived account's page is nothing but the disclaimer +
			     restore — no balances, no register. -->
			<AccountArchivedNotice accountId={accountId()} />
		{:else}
			<!-- Keyed on accountId: every create/edit affordance on the register
			     (create row, create/edit modals, transfer counterparts) is local
			     $state with no lifetime tied to the viewed account. A full remount
			     resets all of it for free on a real account switch — the rows
			     already remount on their own (keyed by transaction.id, which
			     changes account to account), so this only extends churn that's
			     already happening to the header/filter/pagination/modals (#395). -->
			{#key accountId()}
				<TransactionTable
					accountId={accountId()}
					budgetId={budgetId()}
					currency={budget.currency}
					pagination={{
						page: view.result.pagination.page,
						pageSize: view.result.pagination.pageSize,
						total: view.result.pagination.totalTransactionCount
					}}
					{tableState}
					transactions={view.result.transactions}
				>
					{#snippet accountBalances()}
						<AccountBalances balances={view.balances} currency={budget.currency} />
					{/snippet}
				</TransactionTable>
			{/key}
		{/if}
	</Page.Content>
</Page.Root>
