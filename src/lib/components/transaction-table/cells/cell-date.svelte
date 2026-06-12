<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { formatTransactionDate } from '$lib/utils/format-transaction-date';
	import { type CalendarDate, parseDate } from '@internationalized/date';

	import { getCellContext } from '../context.svelte';

	let {
		date,
		rowId
	}: {
		date: string;
		rowId: string;
	} = $props();

	const cellContext = getCellContext();
	let formatted = $derived(date ? formatTransactionDate(parseDate(date)) : '');
</script>

<button
	class="flex size-full items-center justify-end truncate border border-transparent px-2"
	onclick={() => cellContext.editRow(rowId)}
	aria-label={m.transactions_table_edit_date()}
	type="button"
>
	{formatted}
</button>
