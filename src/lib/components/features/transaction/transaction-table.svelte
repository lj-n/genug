<script lang="ts">
	import type { ListTransaction } from '$lib/server/db/user-context/transaction';
	import type { CURRENCIES } from '$lib/utils/currencies';
	import type { Snippet } from 'svelte';

	import { Button } from '$lib/components/ui/button';
	import * as ButtonGroup from '$lib/components/ui/button-group';
	import { EmptyState } from '$lib/components/ui/empty-state';
	import { m } from '$lib/paraglide/messages';
	import ArrowsLeftRightIcon from '~icons/ph/arrows-left-right';
	import FunnelIcon from '~icons/ph/funnel';
	import PlusBoldIcon from '~icons/ph/plus-bold';
	import ReceiptIcon from '~icons/ph/receipt';

	import type { TableState } from './transaction-table-state.svelte';

	import TransactionCreateModal from './transaction-create-modal.svelte';
	import TransactionEditModal from './transaction-edit-modal.svelte';
	import TransactionListMobile from './transaction-list-mobile.svelte';
	import TableBody from './transaction-table-body.svelte';
	import { colsClass } from './transaction-table-cols';
	import TableFilter from './transaction-table-filter.svelte';
	import TableHeader from './transaction-table-header.svelte';
	import TablePagination from './transaction-table-pagination.svelte';
	import TableRowCreate from './transaction-table-row-create.svelte';
	import TableRow from './transaction-table-row.svelte';
	import TransferCreateModal from './transfer-create-modal.svelte';
	import TransferEditModal from './transfer-edit-modal.svelte';
	import TransferTableRowCreate from './transfer-table-row-create.svelte';
	import TransferTableRow from './transfer-table-row.svelte';

	let {
		accountBalances,
		accountId,
		budgetId,
		currency,
		pagination,
		tableState,
		transactions
	}: {
		accountBalances?: Snippet;
		accountId: string;
		budgetId: string;
		currency: (typeof CURRENCIES)[number];
		pagination: { page: number; pageSize: number; total: number };
		tableState: TableState;
		transactions: ListTransaction[];
	} = $props();

	let openCreateRow = $state(false);
	// The inline-row triggers are plain buttons, not popover triggers (the rows
	// own their Popover.Root). Without this exclusion the dismiss layer treats a
	// click on them as an outside interaction and closes the row on pointerdown,
	// which the click handler then immediately reopens (#174). The rows ignore
	// interactions inside this group; the buttons implement toggle/switch.
	let createTriggerGroup = $state<HTMLDivElement | null>(null);
	let createModalOpen = $state(false);
	let editModalOpen = $state(false);
	let editModalTransaction = $state<ListTransaction | null>(null);
	let openTransferCreateRow = $state(false);
	let transferCreateModalOpen = $state(false);
	let transferEditModalOpen = $state(false);
	let transferEditModalTransaction = $state<ListTransaction | null>(null);

	// Every create/edit affordance is scoped to the account being viewed (the
	// create row's hidden accountId, the edit modal's transaction, ...). None of
	// them are torn down by SvelteKit on an account switch — this component is
	// reused across account pages (see the sibling account page's tableState
	// comment) — so an open one left dangling across the switch keeps rendering
	// against data that no longer matches the route, including categories from
	// the budget just navigated away from (#395). Close them all whenever the
	// viewed account changes; reopening after the switch already resolves the
	// current account/budget correctly.
	$effect(() => {
		void accountId;
		openCreateRow = false;
		createModalOpen = false;
		editModalOpen = false;
		editModalTransaction = null;
		openTransferCreateRow = false;
		transferCreateModalOpen = false;
		transferEditModalOpen = false;
		transferEditModalTransaction = null;
	});

	// The empty branches key off the total count, never the rows on this page:
	// a stale page URL beyond the last page must not show onboarding copy over
	// existing data. With no active filters the total is the unfiltered count
	// (transfer legs included), so zero really means "nothing recorded yet".
	const isEmpty = $derived(pagination.total === 0);
	const isFiltered = $derived(tableState.filter.anyActive);
</script>

<div class="space-y-6">
	<TableFilter
		{budgetId}
		filter={tableState.filter}
		leading={accountBalances}
		onSetFilter={(type, value) => tableState.setFilter(type, value)}
		onClearFilter={(type) => tableState.clearFilter(type)}
		onClearAllFilters={() => tableState.clearAllFilters()}
	>
		<!-- One create group per affordance (ADR-0014): the inline popover rows at
		     @3xl and up, the bottom sheets below. Only one group is ever visible. -->
		<!-- The action cluster grows to 44px touch targets in the nav-hidden band
		     (@3xl→@max-7xl); ≥7xl (pointer) it resets to the resting h-9/size-9. -->
		<ButtonGroup.Root class="hidden @3xl/main:flex" bind:ref={createTriggerGroup}>
			<Button
				class="@3xl/main:h-11 @7xl/main:h-9"
				aria-expanded={openCreateRow}
				onclick={() => {
					openTransferCreateRow = false;
					openCreateRow = !openCreateRow;
				}}
			>
				<PlusBoldIcon />
				{m.transactions_table_create_transaction()}
			</Button>
			<Button
				size="icon"
				class="@3xl/main:size-11 @7xl/main:size-9"
				aria-label={m.transactions_table_create_transfer()}
				aria-expanded={openTransferCreateRow}
				onclick={() => {
					openCreateRow = false;
					openTransferCreateRow = !openTransferCreateRow;
				}}
			>
				<ArrowsLeftRightIcon />
			</Button>
		</ButtonGroup.Root>

		<ButtonGroup.Root class="flex @3xl/main:hidden">
			<Button class="h-11" onclick={() => (createModalOpen = true)}>
				<PlusBoldIcon />
				{m.transactions_table_create_transaction()}
			</Button>
			<Button
				size="icon"
				class="size-11"
				aria-label={m.transactions_table_create_transfer()}
				onclick={() => (transferCreateModalOpen = true)}
			>
				<ArrowsLeftRightIcon />
			</Button>
		</ButtonGroup.Root>
	</TableFilter>

	<!-- role="table" wraps only the header/body/mobile row groups; the empty
	     state and pagination (which contains a nav and a menu button) sit outside
	     it, since a table may only contain row/rowgroup children. -->
	<div class="space-y-3">
		<div role="table">
			<TableHeader
				class="hidden @3xl/main:block"
				sort={tableState.sort}
				onToggle={(column) => tableState.toggleSort(column)}
			/>

			<TableBody
				class="hidden rounded-xs border border-muted/20 bg-surface @3xl/main:grid"
				data={transactions}
			>
				{#snippet createrow()}
					<TableRowCreate
						bind:open={openCreateRow}
						{accountId}
						{budgetId}
						class={colsClass}
						interactOutsideIgnore={createTriggerGroup}
						urlParams={tableState.params}
					/>
					<TransferTableRowCreate
						bind:open={openTransferCreateRow}
						{accountId}
						{budgetId}
						class={colsClass}
						interactOutsideIgnore={createTriggerGroup}
					/>
				{/snippet}

				{#snippet row({ cancelEditing, isEditing, item, setEditing })}
					{#if item.transferId}
						<TransferTableRow
							transaction={item}
							{budgetId}
							{currency}
							{isEditing}
							{cancelEditing}
							{setEditing}
						/>
					{:else}
						<TableRow
							transaction={item}
							{budgetId}
							{currency}
							{isEditing}
							{cancelEditing}
							{setEditing}
						/>
					{/if}
				{/snippet}
			</TableBody>

			<TransactionListMobile
				class="@3xl/main:hidden"
				{currency}
				{transactions}
				onEdit={(transaction) => {
					if (transaction.transferId) {
						transferEditModalTransaction = transaction;
						transferEditModalOpen = true;
					} else {
						editModalTransaction = transaction;
						editModalOpen = true;
					}
				}}
			/>
		</div>

		{#if isEmpty && isFiltered}
			<EmptyState
				icon={FunnelIcon}
				title={m.transactions_filtered_empty_title()}
				description={m.transactions_filtered_empty_description()}
			>
				{#snippet action()}
					<Button onclick={() => tableState.clearAllFilters()}>
						{m.transactions_filtered_empty_action()}
					</Button>
				{/snippet}
			</EmptyState>
		{:else if isEmpty && !openCreateRow && !openTransferCreateRow}
			<EmptyState
				icon={ReceiptIcon}
				title={m.transactions_empty_title()}
				description={m.transactions_empty_description()}
			>
				{#snippet action()}
					<!-- Same breakpoint split as the create buttons above: inline row on
					     desktop, bottom sheet below @3xl. -->
					<Button class="hidden @3xl/main:flex" onclick={() => (openCreateRow = true)}>
						{m.transactions_empty_action()}
					</Button>
					<Button class="flex @3xl/main:hidden" onclick={() => (createModalOpen = true)}>
						{m.transactions_empty_action()}
					</Button>
				{/snippet}
			</EmptyState>
		{/if}

		{#if !isEmpty}
			<TablePagination
				page={pagination.page}
				pageSize={pagination.pageSize}
				total={pagination.total}
				onSetPage={(page) => tableState.setPage(page)}
				onSetPageSize={(pageSize) => tableState.setPageSize(pageSize)}
			/>
		{/if}
	</div>
</div>

<TransactionCreateModal
	bind:open={createModalOpen}
	{accountId}
	{budgetId}
	urlParams={tableState.params}
/>

<TransactionEditModal
	bind:open={editModalOpen}
	bind:transaction={editModalTransaction}
	{budgetId}
	{currency}
/>

<TransferCreateModal bind:open={transferCreateModalOpen} {accountId} {budgetId} />

<TransferEditModal
	bind:open={transferEditModalOpen}
	bind:transaction={transferEditModalTransaction}
	{budgetId}
	{currency}
/>
