<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { cn } from 'tailwind-variants';
	import CaretDownIcon from '~icons/ph/caret-down';
	import CaretUpIcon from '~icons/ph/caret-up';
	import CaretUpDownIcon from '~icons/ph/caret-up-down';
	import SealCheckDuotoneIcon from '~icons/ph/seal-check-duotone';

	import type { SortColumn, TransactionSort } from './transaction-sort.svelte';

	import { colsClass } from './transaction-table-cols';

	let {
		class: className,
		onToggle,
		sort
	}: { class?: string; onToggle: (column: SortColumn) => void; sort: TransactionSort } = $props();

	// Expose the active sort to assistive tech: without aria-sort the direction
	// lives only in the caret icon, which a screen reader never announces.
	function ariaSort(column: SortColumn): 'ascending' | 'descending' | 'none' {
		if (sort.column !== column) return 'none';
		return sort.direction === 'asc' ? 'ascending' : 'descending';
	}

	const sortButtonClass =
		'inline-flex items-center justify-center @3xl/main:size-11 @7xl/main:size-auto';
</script>

{#snippet sortIcon(column: SortColumn)}
	{#if sort.column === column && sort.direction === 'asc'}
		<CaretUpIcon class="size-4 cursor-pointer text-foreground" />
	{:else if sort.column === column && sort.direction === 'desc'}
		<CaretDownIcon class="size-4 cursor-pointer text-foreground" />
	{:else}
		<CaretUpDownIcon class="size-4 cursor-pointer text-muted" />
	{/if}
{/snippet}

<div role="rowgroup" class={className}>
	<!-- Touch band (#297): sort buttons grow to 44px targets in the nav-hidden
	     band (@3xl→@max-7xl), the row grows with them; ≥7xl (pointer) both snap
	     back to the resting geometry. -->
	<div role="row" class={cn(colsClass, 'mb-1 grid h-8 items-center @3xl/main:h-11 @7xl/main:h-8')}>
		<div
			role="columnheader"
			aria-sort={ariaSort('category')}
			class="flex items-center gap-1 px-2 font-display text-xs font-medium tracking-wider text-muted uppercase"
		>
			{m.transactions_table_header_category()}
			<button
				class={sortButtonClass}
				onclick={() => onToggle('category')}
				aria-label={m.transactions_table_sort_category()}
			>
				{@render sortIcon('category')}
			</button>
		</div>
		<div
			role="columnheader"
			class="px-2 font-display text-xs font-medium tracking-wider text-muted uppercase"
		>
			{m.transactions_table_header_notes()}
		</div>
		<div
			role="columnheader"
			aria-sort={ariaSort('date')}
			class="flex items-center justify-end gap-1 px-2 font-display text-xs font-medium tracking-wider text-muted uppercase"
		>
			<button
				class={sortButtonClass}
				onclick={() => onToggle('date')}
				aria-label={m.transactions_table_sort_date()}
			>
				{@render sortIcon('date')}
			</button>
			{m.transactions_table_header_date()}
		</div>
		<div
			role="columnheader"
			aria-sort={ariaSort('amount')}
			class="flex items-center justify-end gap-1 px-2 font-display text-xs font-medium tracking-wider text-muted uppercase"
		>
			<button
				class={sortButtonClass}
				onclick={() => onToggle('amount')}
				aria-label={m.transactions_table_sort_amount()}
			>
				{@render sortIcon('amount')}
			</button>
			{m.transactions_table_header_amount()}
		</div>
		<div
			role="columnheader"
			aria-sort={ariaSort('validated')}
			class="flex items-center justify-end gap-1 px-2 font-display text-xs font-medium tracking-wider text-muted uppercase"
		>
			<button
				class={sortButtonClass}
				onclick={() => onToggle('validated')}
				aria-label={m.transactions_table_sort_validated()}
			>
				{@render sortIcon('validated')}
			</button>
			<SealCheckDuotoneIcon class="size-4 text-success" aria-hidden="true" />
			<span class="sr-only">{m.transaction_validated_label()}</span>
		</div>
	</div>
</div>
