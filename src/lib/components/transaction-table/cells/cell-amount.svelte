<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { getBudget } from '$lib/remote-functions/budget.remote';
	import { formatCurrency } from '$lib/utils/format-currency';

	import { getCellContext } from '../context.svelte';

	let {
		amount,
		rowId
	}: {
		amount: number;
		rowId: string;
	} = $props();

	const cellContext = getCellContext();
	const currency = $derived((await getBudget({ budgetId: cellContext.budgetId })).currency);
</script>

<button
	class="flex size-full items-center justify-end border border-transparent px-2 font-currency"
	onclick={() => cellContext.editRow(rowId)}
	aria-label={m.transactions_table_edit_amount()}
	type="button"
>
	{formatCurrency({ centValue: amount, currency })}
</button>
