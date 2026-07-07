<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { cn } from 'tailwind-variants';
	import CaretDownIcon from '~icons/ph/caret-down';
	import CaretUpIcon from '~icons/ph/caret-up';
	import CaretUpDownIcon from '~icons/ph/caret-up-down';

	import type { SortColumn, TransactionSort } from './sort.svelte';

	import { colsClass } from './utils';
	import ValidationCheckbox from './validation-checkbox.svelte';

	let { sort }: { sort: TransactionSort } = $props();
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

<div role="rowgroup">
	<div role="row" class={cn(colsClass, 'grid items-center rounded-lg bg-muted/5')}>
		<div role="columnheader" class="flex items-center gap-1 px-4 text-sm font-semibold">
			{m.transactions_table_header_category()}
			<button onclick={() => sort.toggle('category')}>
				{@render sortIcon('category')}
			</button>
		</div>
		<div role="columnheader" class="px-4 text-sm font-semibold">
			{m.transactions_table_header_notes()}
		</div>
		<div role="columnheader" class="flex items-center justify-end gap-1 px-4 text-sm font-semibold">
			<button onclick={() => sort.toggle('date')}>
				{@render sortIcon('date')}
			</button>
			{m.transactions_table_header_date()}
		</div>
		<div role="columnheader" class="flex items-center justify-end gap-1 px-4 text-sm font-semibold">
			<button onclick={() => sort.toggle('amount')}>
				{@render sortIcon('amount')}
			</button>
			{m.transactions_table_header_amount()}
		</div>
		<div role="columnheader" class="flex items-center gap-1 px-2 text-sm font-semibold">
			<ValidationCheckbox checked={true} disabled={true} />
			<button onclick={() => sort.toggle('validated')}>
				{@render sortIcon('validated')}
			</button>
		</div>
	</div>
</div>
