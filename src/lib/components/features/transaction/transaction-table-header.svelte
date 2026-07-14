<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { cn } from 'tailwind-variants';
	import CaretDownIcon from '~icons/ph/caret-down';
	import CaretUpIcon from '~icons/ph/caret-up';
	import CaretUpDownIcon from '~icons/ph/caret-up-down';

	import type { SortColumn, TransactionSort } from './transaction-sort.svelte';

	import { colsClass } from './transaction-table-cols';
	import ValidationCheckbox from './transaction-validation-checkbox.svelte';

	let {
		class: className,
		onToggle,
		sort
	}: { class?: string; onToggle: (column: SortColumn) => void; sort: TransactionSort } = $props();
</script>

{#snippet sortIcon(column: SortColumn)}
	{#if sort.column === column && sort.direction === 'asc'}
		<CaretUpIcon class="text-accent size-4 cursor-pointer" />
	{:else if sort.column === column && sort.direction === 'desc'}
		<CaretDownIcon class="text-accent size-4 cursor-pointer" />
	{:else}
		<CaretUpDownIcon class="size-4 cursor-pointer text-muted" />
	{/if}
{/snippet}

<div role="rowgroup" class={className}>
	<div role="row" class={cn(colsClass, 'grid items-center rounded-lg bg-muted/5')}>
		<div role="columnheader" class="flex items-center gap-1 px-4 text-sm font-semibold">
			{m.transactions_table_header_category()}
			<button
				onclick={() => onToggle('category')}
				aria-label={m.transactions_table_sort_category()}
			>
				{@render sortIcon('category')}
			</button>
		</div>
		<div role="columnheader" class="px-4 text-sm font-semibold">
			{m.transactions_table_header_notes()}
		</div>
		<div role="columnheader" class="flex items-center justify-end gap-1 px-4 text-sm font-semibold">
			<button onclick={() => onToggle('date')} aria-label={m.transactions_table_sort_date()}>
				{@render sortIcon('date')}
			</button>
			{m.transactions_table_header_date()}
		</div>
		<div role="columnheader" class="flex items-center justify-end gap-1 px-4 text-sm font-semibold">
			<button onclick={() => onToggle('amount')} aria-label={m.transactions_table_sort_amount()}>
				{@render sortIcon('amount')}
			</button>
			{m.transactions_table_header_amount()}
		</div>
		<div role="columnheader" class="flex items-center gap-1 px-2 text-sm font-semibold">
			<button
				onclick={() => onToggle('validated')}
				aria-label={m.transactions_table_sort_validated()}
			>
				{@render sortIcon('validated')}
			</button>
			<ValidationCheckbox checked={true} disabled={true} />
		</div>
	</div>
</div>
