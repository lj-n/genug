<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import { getBudget } from '$lib/remote-functions/budget.remote';
	import {
		batchValidateTransactions,
		listTransactions
	} from '$lib/remote-functions/transaction.remote';
	import { formatTransactionDate } from '$lib/utils/format-transaction-date';
	import { asMoney, formatMoney } from '$lib/utils/money';
	import { parseDate } from '@internationalized/date';
	import { untrack } from 'svelte';
	import PlusBoldIcon from '~icons/ph/plus-bold';
	import SealIcon from '~icons/ph/seal';
	import SealCheckDuotoneIcon from '~icons/ph/seal-check-duotone';

	import { TransactionSort } from './sort.svelte';
	import TableBody from './table-body.svelte';
	import TableCell from './table-cell.svelte';
	import TableFilter from './table-filter.svelte';
	import TableHeader from './table-header.svelte';
	import TablePagination from './table-pagination.svelte';
	import TableRowCreate from './table-row-create.svelte';
	import TableRowEdit from './table-row-edit.svelte';
	import TableRow from './table-row.svelte';
	import { getTransactionURLParams } from './utils';

	let { accountId, budgetId }: { accountId: string; budgetId: string } = $props();

	const budget = $derived(await getBudget(budgetId));

	const params = $derived(getTransactionURLParams(page.url));
	let sort = $state(new TransactionSort(untrack(() => params)));

	const result = $derived(await listTransactions({ accountId, ...params }));
	const transactions = $derived(result.transactions);
	const pagination = $derived(result.pagination);

	let openCreateRow = $state(false);
</script>

<div class="space-y-6">
	<TableFilter {budgetId}>
		<Button onclick={() => (openCreateRow = true)} class="ml-auto">
			<PlusBoldIcon />
			{m.transactions_table_create_transaction()}
		</Button>
	</TableFilter>

	<div role="table" class="space-y-3">
		<TableHeader {sort} />

		<TableBody data={transactions}>
			{#snippet createrow()}
				<TableRowCreate bind:open={openCreateRow} {accountId} {budgetId} />
			{/snippet}

			{#snippet row({ cancelEditing, isEditing, item, setEditing })}
				{#if isEditing}
					<TableRowEdit transaction={item} {budgetId} {cancelEditing} />
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
							{formatMoney({ currency: budget.currency, money: asMoney(item.amount) })}
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
			pageSize={pagination.pageSize}
			currentPage={pagination.page}
			total={pagination.totalTransactionCount}
		/>
	</div>
</div>
