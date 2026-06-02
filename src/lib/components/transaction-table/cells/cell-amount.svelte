<script lang="ts">
	import type { Row } from '@tanstack/table-core';

	import { InputCurrency } from '$lib/components/ui/input-currency';
	import { m } from '$lib/paraglide/messages';
	import { getBudgetContext } from '$lib/utils/budget-context';
	import { focusAndSelect } from '$lib/utils/focus-and-select';
	import { formatCurrency } from '$lib/utils/format-currency';

	import type { TransactionRow } from '../types';

	import { getTableContext } from '../context.svelte';
	import CellEditable from './cell-editable.svelte';

	let { amount, row }: { amount: number; row: Row<TransactionRow> } = $props();

	const tableContext = getTableContext();
	const getBudget = getBudgetContext();
	const currency = $derived(getBudget().currency);

	const { form: formData } = tableContext.editForm;

	let inputRef = $state<HTMLInputElement>(null!);
</script>

<CellEditable
	{row}
	name="amount"
	align="end"
	ariaLabel={m.transactions_table_edit_amount()}
	buttonClass="truncate font-currency"
	onEdit={() => focusAndSelect(inputRef)}
>
	{#snippet view()}
		{formatCurrency({ centValue: amount, currency })}
	{/snippet}

	{#snippet edit({ props })}
		<InputCurrency
			bind:ref={inputRef}
			bind:value={$formData.amount}
			{...props}
			{currency}
			class="px-2 text-right font-currency font-medium"
		/>
	{/snippet}
</CellEditable>
