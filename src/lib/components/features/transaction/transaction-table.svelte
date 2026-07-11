<script lang="ts">
	import type { ListTransaction } from '$lib/server/db/user-context/transaction';
	import type { CURRENCIES } from '$lib/utils/currencies';

	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import { batchValidateTransactions } from '$lib/remote-functions/transaction.remote';
	import { formatTransactionDate } from '$lib/utils/format-transaction-date';
	import { asMoney, formatMoney } from '$lib/utils/money';
	import { parseDate } from '@internationalized/date';
	import PlusBoldIcon from '~icons/ph/plus-bold';
	import SealIcon from '~icons/ph/seal';
	import SealCheckDuotoneIcon from '~icons/ph/seal-check-duotone';

	import type { TableState } from './transaction-table-state.svelte';

	import TableBody from './transaction-table-body.svelte';
	import TableCell from './transaction-table-cell.svelte';
	import { colsClass } from './transaction-table-cols';
	import TableFilter from './transaction-table-filter.svelte';
	import TableHeader from './transaction-table-header.svelte';
	import TablePagination from './transaction-table-pagination.svelte';
	import TableRowCreate from './transaction-table-row-create.svelte';
	import TableRowEdit from './transaction-table-row-edit.svelte';
	import TableRow from './transaction-table-row.svelte';

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
</script>

<div class="space-y-6">
	<TableFilter
		{budgetId}
		filter={tableState.filter}
		onSetFilter={(type, value) => tableState.setFilter(type, value)}
		onClearFilter={(type) => tableState.clearFilter(type)}
		onClearAllFilters={() => tableState.clearAllFilters()}
	>
		<Button onclick={() => (openCreateRow = true)} class="ml-auto">
			<PlusBoldIcon />
			{m.transactions_table_create_transaction()}
		</Button>
	</TableFilter>

	<div role="table" class="space-y-3">
		<TableHeader sort={tableState.sort} onToggle={(column) => tableState.toggleSort(column)} />

		<TableBody data={transactions}>
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
					{@const validation = batchValidateTransactions.for(item.id)}

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
								<form {...validation} class="grid size-full place-content-center">
									<input {...validation.fields.validated.as('hidden', !item.validated)} />

									<Button
										type="submit"
										name={validation.fields.ids.as('select multiple').name}
										value={[item.id]}
										size="icon-lg"
										variant="ghost"
										class="rounded-xs hover:bg-transparent"
										aria-label={m.transactions_table_toggle_validated()}
									>
										{#if item.validated}
											<SealCheckDuotoneIcon class="size-6 text-success" />
										{:else}
											<SealIcon class="size-6 text-muted" />
										{/if}
									</Button>
								</form>
							{/snippet}
						</TableCell>
					</TableRow>
				{/if}
			{/snippet}
		</TableBody>

		<TablePagination
			page={pagination.page}
			pageSize={pagination.pageSize}
			total={pagination.total}
			onSetPage={(page) => tableState.setPage(page)}
			onSetPageSize={(pageSize) => tableState.setPageSize(pageSize)}
		/>
	</div>
</div>
