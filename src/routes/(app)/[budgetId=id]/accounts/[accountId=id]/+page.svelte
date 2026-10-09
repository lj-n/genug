<script lang="ts">
	import type { TableParams } from '$lib/components/features/transaction';

	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { AccountArchivedNotice, AccountBalances } from '$lib/components/features/account';
	import {
		pruneForeignCategoryIds,
		TransactionTable,
		UrlTableState
	} from '$lib/components/features/transaction';
	import { Button } from '$lib/components/ui/button';
	import * as Page from '$lib/components/ui/page';
	import { m } from '$lib/paraglide/messages';
	import { getAccount, getAccountBalances } from '$lib/remote-functions/account.remote';
	import { getBudget } from '$lib/remote-functions/budget.remote';
	import { getCategories } from '$lib/remote-functions/category.remote';
	import { getCheckpointSummary } from '$lib/remote-functions/checkpoint.remote';
	import {
		getRememberedPageSize,
		listTransactions
	} from '$lib/remote-functions/transaction.remote';
	import { TransactionsURLParamsSchema } from '$lib/schemas/transaction';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import { formatRelativeDate } from '$lib/utils/format-relative-date';
	import { formatTransactionDate } from '$lib/utils/format-transaction-date';
	import { stickyParam } from '$lib/utils/sticky-param';
	import { fromDate, getLocalTimeZone, toCalendarDate } from '@internationalized/date';
	import { untrack } from 'svelte';
	import * as v from 'valibot';
	import GearSixIcon from '~icons/ph/gear-six';
	import StampIcon from '~icons/ph/stamp';

	import type { PageProps } from './$types';

	let { params }: PageProps = $props();

	const budgetId = getBudgetId();
	const accountId = stickyParam(() => params.accountId);

	const account = $derived(await getAccount(accountId()));
	const balanceDetail = $derived(await getAccountBalances(accountId()));
	const checkpointSummary = $derived(await getCheckpointSummary(accountId()));
	const budget = $derived(await getBudget(budgetId()));
	const latestCheckpoint = $derived.by(() => {
		if (!checkpointSummary.lastCheckpointAt) return null;
		const date = toCalendarDate(fromDate(checkpointSummary.lastCheckpointAt, getLocalTimeZone()));
		return { exact: formatTransactionDate(date), relative: formatRelativeDate({ date }) };
	});
	const checkpointHref = $derived(
		resolve('/(app)/[budgetId=id]/accounts/[accountId=id]/checkpoint', {
			accountId: accountId(),
			budgetId: budgetId()
		})
	);
	// The remembered page size: the fallback when the URL has no `pageSize`,
	// and the baseline below which the URL stays clean.
	const defaultPageSize = $derived(await getRememberedPageSize());

	// A dropdown pick also wrote the cookie; keep the cached query in step so the
	// rest of this session (URL baseline, other accounts) matches the next load.
	function rememberPageSize(size: number) {
		getRememberedPageSize().set(size);
	}

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
			pageSize: searchParams.get('pageSize') ?? defaultPageSize,
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
		if (tableParams.pageSize !== defaultPageSize)
			searchParams.set('pageSize', String(tableParams.pageSize));
		if (tableParams.sortAmount) searchParams.set('sortAmount', tableParams.sortAmount);
		if (tableParams.sortCategory) searchParams.set('sortCategory', tableParams.sortCategory);
		if (tableParams.sortDate) searchParams.set('sortDate', tableParams.sortDate);
		if (tableParams.sortValidated) searchParams.set('sortValidated', tableParams.sortValidated);
		return searchParams.toString();
	}

	// Read tracked so filter hydration waits for the list; it is stable per budget,
	// so pruning adds no table reset beyond a navigation's own below (#371/#372).
	const knownCategoryIds = $derived(
		new Set((await getCategories({ budgetId: budgetId() })).map((c) => c.id))
	);

	/** The current URL's table params, minus category ids foreign to this budget (#372). */
	function prunedURLParams() {
		const params = parseURLParams(page.url);
		params.categoryId = pruneForeignCategoryIds(params.categoryId, knownCategoryIds);
		return params;
	}

	// One table state per page visit, never built in a derived: under async,
	// Svelte may re-run a derived while a navigation settles, and the filter bar
	// and its handlers ended up on different copies (#434). It keeps its own URL
	// writes and resets in place from any other URL it lands on (#371); a full
	// load or reload builds it from the URL (deep links).
	const table = new UrlTableState(page.url, prunedURLParams());
	const tableState = table.state;

	// Effect, not derived: resetting the state is a write that must happen once
	// per landed navigation, and only after it commits. A pending navigation
	// lists with its URL's params meanwhile (see `tableParams`). Committing
	// also means `knownCategoryIds` has loaded for the new budget, so a Back
	// across budgets keeps its own category ids (#448).
	$effect.pre(() => {
		const url = page.url;
		untrack(() => table.follow(url, prunedURLParams));
	});

	const tableParams = $derived(table.paramsAt(page.url, prunedURLParams));

	const result = $derived(await listTransactions({ accountId: accountId(), ...tableParams }));

	// The archived⇄active branch decision reads the register's queries through
	// this one object, so restoring in place never introduces a first-time
	// await mid-update — that leaves the fragment permanently blank in
	// production builds.
	const view = $derived({
		archived: account.archivedAt !== null,
		balances,
		result
	});

	// Effect: writing the table state back to the URL is a navigation (`goto`),
	// an imperative side effect no derived may perform.
	$effect(() => {
		const nextQuery = buildSearch(tableParams);
		if (nextQuery === page.url.searchParams.toString()) return;
		const target = resolve(`/(app)/[budgetId=id]/accounts/[accountId=id]?${nextQuery}`, {
			accountId: accountId(),
			budgetId: budgetId()
		});
		table.navigatingTo(new URL(target, page.url));
		goto(target, { keepFocus: true, noScroll: true });
	});
</script>

<Page.Root>
	<Page.Header class="flex-row flex-wrap items-center justify-between gap-4">
		<div class="grid gap-1">
			<Page.Title>
				{account.name}
			</Page.Title>
			{#if !account.archivedAt}
				{#if latestCheckpoint}
					<a
						href={resolve('/(app)/[budgetId=id]/accounts/[accountId=id]/checkpoint#history', {
							accountId: accountId(),
							budgetId: budgetId()
						})}
						title={latestCheckpoint.exact}
						class="flex w-fit items-center gap-1.5 text-sm text-muted hover:text-foreground"
					>
						<StampIcon class="text-success" />
						{m.checkpoint_last({ relative: latestCheckpoint.relative })}
					</a>
				{:else}
					<p class="flex items-center gap-1.5 text-sm text-muted">
						<StampIcon />
						{m.checkpoint_none()}
					</p>
				{/if}
			{/if}
		</div>

		{#if !account.archivedAt}
			<div class="flex items-center gap-1">
				<Button
					variant="ghost"
					size="icon"
					class="relative"
					title={checkpointSummary.suggested
						? m.checkpoint_button_suggested()
						: m.checkpoint_button_label()}
					href={checkpointHref}
				>
					<StampIcon />
					<span class="sr-only">
						{checkpointSummary.suggested
							? m.checkpoint_button_suggested()
							: m.checkpoint_button_label()}
					</span>
					{#if checkpointSummary.suggested}
						<span class="absolute top-1.5 right-1.5 size-2 rounded-full bg-focus"></span>
					{/if}
				</Button>
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
			</div>
		{/if}
	</Page.Header>

	<Page.Content>
		{#if view.archived}
			<!-- An archived account's page is nothing but the disclaimer +
			     restore — no balances, no register. -->
			<AccountArchivedNotice accountId={accountId()} />
		{:else}
			<TransactionTable
				accountId={accountId()}
				budgetId={budgetId()}
				currency={budget.currency}
				onRememberPageSize={rememberPageSize}
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
		{/if}
	</Page.Content>
</Page.Root>
