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
	let createModalOpen = $state(false);
	let editModalOpen = $state(false);
	let editModalTransaction = $state<ListTransaction | null>(null);
	let openTransferCreateRow = $state(false);
	let transferCreateModalOpen = $state(false);
	let transferEditModalOpen = $state(false);
	let transferEditModalTransaction = $state<ListTransaction | null>(null);

	// Branch on the *total* (filtered) count, not the rows on this page, so a
	// stale page URL beyond the last page never shows onboarding copy over data.
	const isEmpty = $derived(pagination.total === 0);
	// Mirror the params that actually reached the server — an added-but-blank
	// filter chip must not flip the copy to "no matches".
	const filtersApplied = $derived(
		tableState.params.categoryId.length > 0 || tableState.params.notes !== undefined
	);
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
		<ButtonGroup.Root class="ml-auto hidden @3xl/main:flex">
			<Button onclick={() => (openCreateRow = true)}>
				<PlusBoldIcon />
				{m.transactions_table_create_transaction()}
			</Button>
			<Button
				size="icon"
				aria-label={m.transactions_table_create_transfer()}
				onclick={() => (openTransferCreateRow = true)}
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
					urlParams={tableState.params}
				/>
				<TransferTableRowCreate
					bind:open={openTransferCreateRow}
					{accountId}
					{budgetId}
					class={colsClass}
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

		{#if isEmpty}
			{#if filtersApplied}
				<EmptyState icon={FunnelIcon} title={m.transactions_table_empty_filtered_title()}>
					{#snippet action()}
						<Button onclick={() => tableState.clearAllFilters()}>
							{m.transactions_table_empty_filtered_clear()}
						</Button>
					{/snippet}
				</EmptyState>
			{:else}
				<EmptyState
					icon={ReceiptIcon}
					title={m.transactions_table_empty_title()}
					description={m.transactions_table_empty_description()}
				>
					{#snippet action()}
						<p class="max-w-md rounded-lg border border-info/30 bg-info/5 p-3 text-sm text-info">
							{m.transactions_table_empty_income_hint()}
						</p>
						<!-- Same breakpoint split as the toolbar buttons above: inline
						     popover row at @3xl and up, bottom sheet below. -->
						<Button onclick={() => (openCreateRow = true)} class="hidden @3xl/main:flex">
							<PlusBoldIcon />
							{m.transactions_table_empty_create()}
						</Button>
						<Button onclick={() => (createModalOpen = true)} class="flex h-11 @3xl/main:hidden">
							<PlusBoldIcon />
							{m.transactions_table_empty_create()}
						</Button>
					{/snippet}
				</EmptyState>
			{/if}
		{:else}
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
