<script lang="ts">
	import type { ListTransaction } from '$lib/server/db/user-context/transaction';
	import type { CURRENCIES } from '$lib/utils/currencies';

	import { m } from '$lib/paraglide/messages';
	import { formatTransactionDate } from '$lib/utils/format-transaction-date';
	import { asMoney, formatMoney } from '$lib/utils/money';
	import { parseDate } from '@internationalized/date';
	import { cn } from 'tailwind-variants';

	import { groupTransactionsByDate } from './group-transactions-by-date';
	import ValidateToggle from './transaction-validate-toggle.svelte';

	let {
		class: className,
		currency,
		onEdit,
		transactions
	}: {
		class?: string;
		currency: (typeof CURRENCIES)[number];
		onEdit: (transaction: ListTransaction) => void;
		transactions: ListTransaction[];
	} = $props();

	const groups = $derived(groupTransactionsByDate(transactions));
</script>

<!-- Mobile register (ADR-0014): date-grouped cards below @3xl. The card re-uses
     the row grid, re-templated via grid areas — the validated toggle becomes a
     full-height right rail, date moves into the group header. -->
<div role="presentation" class={cn('grid gap-4', className)}>
	{#each groups as group (group.date)}
		<div role="rowgroup" class="grid gap-1.5">
			<div role="row">
				<div role="cell" class="px-1 text-sm font-semibold text-muted">
					{formatTransactionDate(parseDate(group.date))}
				</div>
			</div>

			{#each group.transactions as item (item.id)}
				<div
					role="row"
					class="grid grid-cols-[minmax(0,1fr)_auto_3.5rem] overflow-hidden rounded-sm border border-muted/10 bg-surface [grid-template-areas:'category_amount_toggle'_'notes_notes_toggle']"
				>
					<div role="cell" class="min-w-0 [grid-area:category]">
						<button
							type="button"
							class="flex min-h-11 w-full items-center px-3 text-left"
							aria-label={m.transactions_table_edit_category()}
							onclick={() => onEdit(item)}
						>
							<span class="truncate">
								{#if item.categoryName}
									{item.categoryName}
								{:else}
									<span class="text-muted">{m.transaction_table_cell_category_empty()}</span>
								{/if}
							</span>
						</button>
					</div>

					<div role="cell" class="[grid-area:amount]">
						<button
							type="button"
							class="flex min-h-11 w-full items-center justify-end px-3"
							aria-label={m.transactions_table_edit_amount()}
							onclick={() => onEdit(item)}
						>
							<span class={cn('font-currency', item.amount > 0 && 'text-success')}>
								{formatMoney({
									currency,
									money: asMoney(item.amount),
									options: { signDisplay: 'exceptZero' }
								})}
							</span>
						</button>
					</div>

					<div role="cell" class="min-w-0 [grid-area:notes]">
						<button
							type="button"
							class="flex min-h-11 w-full items-center px-3 pb-1 text-left"
							aria-label={m.transactions_table_edit_notes()}
							onclick={() => onEdit(item)}
						>
							<span class="truncate text-sm text-muted">{item.notes ?? ''}</span>
						</button>
					</div>

					<div role="cell" class="border-l border-muted/10 [grid-area:toggle]">
						<ValidateToggle transaction={item} scope="mobile" class="size-full rounded-none" />
					</div>
				</div>
			{/each}
		</div>
	{/each}
</div>
