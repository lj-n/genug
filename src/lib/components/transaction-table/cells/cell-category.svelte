<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { cn } from 'tailwind-variants';

	import { getCellContext } from '../context.svelte';

	let {
		categoryName,
		rowId
	}: {
		categoryName: null | string;
		rowId: string;
	} = $props();

	const cellContext = getCellContext();

	let withoutCategory = $derived(categoryName === null);
</script>

<button
	class={cn(
		'flex size-full items-center justify-start gap-2 border border-transparent px-2',
		withoutCategory && 'text-muted'
	)}
	onclick={() => cellContext.editRow(rowId)}
	aria-label={m.transactions_table_edit_category()}
	type="button"
>
	{withoutCategory ? m.transaction_table_cell_category_empty() : categoryName}
</button>
