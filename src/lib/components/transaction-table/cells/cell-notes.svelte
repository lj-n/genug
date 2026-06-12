<script lang="ts">
	import { m } from '$lib/paraglide/messages';

	import { getCellContext } from '../context.svelte';

	let {
		notes,
		rowId
	}: {
		notes: null | string;
		rowId: string;
	} = $props();

	const cellContext = getCellContext();

	let display = $derived(notes ?? '');
</script>

<button
	class="flex size-full items-center justify-start truncate border border-transparent px-2"
	onclick={() => cellContext.editRow(rowId)}
	aria-label={m.transactions_table_edit_notes()}
	type="button"
>
	{display}
</button>
