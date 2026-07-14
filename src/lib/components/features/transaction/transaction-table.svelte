<script lang="ts">
	import type { ListTransaction } from '$lib/server/db/user-context/transaction';
	import type { CURRENCIES } from '$lib/utils/currencies';

	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import { formatTransactionDate } from '$lib/utils/format-transaction-date';
	import { asMoney, formatMoney } from '$lib/utils/money';
	import { parseDate } from '@internationalized/date';
	import PlusBoldIcon from '~icons/ph/plus-bold';

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
</script>

<div class="space-y-6">
	<TableFilter
		{budgetId}
		filter={tableState.filter}
		onSetFilter={(type, value) => tableState.setFilter(type, value)}
		onClearFilter={(type) => tableState.clearFilter(type)}
		onClearAllFilters={() => tableState.clearAllFilters()}
	>
		<!-- One create button per affordance (ADR-0013): the inline popover row at
		     @3xl and up, the bottom sheet below. Only one is ever visible. -->
		<Button onclick={() => (openCreateRow = true)} class="ml-auto hidden @3xl/main:flex">
			<PlusBoldIcon />
			{m.transactions_table_create_transaction()}
		</Button>
		<Button onclick={() => (createModalOpen = true)} class="ml-auto flex h-11 @3xl/main:hidden">
			<PlusBoldIcon />
			{m.transactions_table_create_transaction()}
		</Button>
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
			{/snippet}

			{#snippet row({ cancelEditing, isEditing, item, setEditing })}
				{#if isEditing}
					<TableRowEdit transaction={item} {budgetId} {currency} {cancelEditing} />
				{:else}
					<TableRow>
						<TableCell aria-label={m.transactions_table_edit_category()} onclick={setEditing}>
							{#if item.categoryName}
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
				editModalTransaction = transaction;
				editModalOpen = true;
			}}
		/>

		<TablePagination
			page={pagination.page}
			pageSize={pagination.pageSize}
			total={pagination.total}
			onSetPage={(page) => tableState.setPage(page)}
			onSetPageSize={(pageSize) => tableState.setPageSize(pageSize)}
		/>
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
