<script lang="ts">
	import type { ListTransaction } from '$lib/server/db/user-context/transaction';
	import type { CURRENCIES } from '$lib/utils/currencies';

	import { Button } from '$lib/components/ui/button';
	import * as ButtonGroup from '$lib/components/ui/button-group';
	import { EmptyState } from '$lib/components/ui/empty-state';
	import { m } from '$lib/paraglide/messages';
	import { formatTransactionDate } from '$lib/utils/format-transaction-date';
	import { asMoney, formatMoney } from '$lib/utils/money';
	import { parseDate } from '@internationalized/date';
	import ArrowsLeftRightIcon from '~icons/ph/arrows-left-right';
	import FunnelIcon from '~icons/ph/funnel';
	import PlusBoldIcon from '~icons/ph/plus-bold';
	import ReceiptIcon from '~icons/ph/receipt';

	import type { TableState } from './transaction-table-state.svelte';

	import TransactionCreateModal from './transaction-create-modal.svelte';
	import TransactionEditModal from './transaction-edit-modal.svelte';
	import TransactionListMobile from './transaction-list-mobile.svelte';
	import TableBody from './transaction-table-body.svelte';
	import TableCell from './transaction-table-cell.svelte';
	import { colsClass } from './transaction-table-cols';
	import TableFilter from './transaction-table-filter.svelte';
	import TableHeader from './transaction-table-header.svelte';
	import TablePagination from './transaction-table-pagination.svelte';
	import TableRowCreate from './transaction-table-row-create.svelte';
	import TableRowEdit from './transaction-table-row-edit.svelte';
	import TableRow from './transaction-table-row.svelte';
	import ValidateToggle from './transaction-validate-toggle.svelte';
	import TransferBadge from './transfer-badge.svelte';
	import TransferCreateModal from './transfer-create-modal.svelte';
	import TransferEditModal from './transfer-edit-modal.svelte';
	import TransferTableRowCreate from './transfer-table-row-create.svelte';
	import TransferTableRowEdit from './transfer-table-row-edit.svelte';

	let {
		accountId,
		budgetId,
		currency,
		pagination,
		tableState,
		transactions
	}: {
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
		onSetFilter={(type, value) => tableState.setFilter(type, value)}
		onClearFilter={(type) => tableState.clearFilter(type)}
		onClearAllFilters={() => tableState.clearAllFilters()}
	>
		<!-- One create group per affordance (ADR-0014): the inline popover rows at
		     @3xl and up, the bottom sheets below. Only one group is ever visible. -->
		<ButtonGroup.Root class="ml-auto hidden @3xl/main:flex" bind:ref={createTriggerGroup}>
			<Button
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

		<ButtonGroup.Root class="ml-auto flex @3xl/main:hidden">
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

	<div role="table" class="space-y-3">
		<TableHeader
			class="hidden @3xl/main:block"
			sort={tableState.sort}
			onToggle={(column) => tableState.toggleSort(column)}
		/>

		<TableBody class="hidden @3xl/main:grid" data={transactions}>
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
					urlParams={tableState.params}
				/>
			{/snippet}

			{#snippet row({ cancelEditing, isEditing, item, setEditing })}
				{#if isEditing && item.transferId}
					<TransferTableRowEdit transaction={item} {budgetId} {currency} {cancelEditing} />
				{:else if isEditing}
					<TableRowEdit transaction={item} {budgetId} {currency} {cancelEditing} />
				{:else}
					<TableRow>
						<TableCell aria-label={m.transactions_table_edit_category()} onclick={setEditing}>
							{#if item.transferId}
								<TransferBadge transaction={item} />
							{:else if item.categoryName}
								{item.categoryName}
							{:else}
								<span class="text-muted">
									{m.transaction_table_cell_category_empty()}
								</span>
							{/if}
						</TableCell>

						<TableCell aria-label={m.transactions_table_edit_notes()} onclick={setEditing}>
							{item.notes ?? ''}
						</TableCell>

						<TableCell
							aria-label={m.transactions_table_edit_date()}
							onclick={setEditing}
							class="justify-end"
						>
							{formatTransactionDate(parseDate(item.date))}
						</TableCell>

						<TableCell
							aria-label={m.transactions_table_edit_amount()}
							onclick={setEditing}
							class="justify-end font-currency font-normal"
						>
							{formatMoney({ currency, money: asMoney(item.amount) })}
						</TableCell>

						<TableCell>
							{#snippet child()}
								<ValidateToggle transaction={item} />
							{/snippet}
						</TableCell>
					</TableRow>
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

<TransferCreateModal
	bind:open={transferCreateModalOpen}
	{accountId}
	{budgetId}
	urlParams={tableState.params}
/>

<TransferEditModal
	bind:open={transferEditModalOpen}
	bind:transaction={transferEditModalTransaction}
	{budgetId}
	{currency}
/>
