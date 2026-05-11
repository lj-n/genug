<script lang="ts">
	import type { Row } from '@tanstack/table-core';

	import { InputCurrency } from '$lib/components/ui/input-currency';
	import { m } from '$lib/paraglide/messages';
	import { getIntlContext } from '$lib/utils/intl-context.svelte';
	import { tick } from 'svelte';

	import type { TransactionRow } from './types';

	import TableCellEditable from './table-cell-editable.svelte';
	import { getTableContext } from './table-context.svelte';

	let { amount, row }: { amount: number; row: Row<TransactionRow> } = $props();

	const tableContext = getTableContext();
	const intlContext = getIntlContext();
	const { form: formData } = tableContext.form;

	let inputRef = $state<HTMLInputElement>(null!);

	function onEdit() {
		tick().then(() => {
			inputRef.focus();
			inputRef.select();
		});
	}
</script>

<TableCellEditable
	{row}
	name="amount"
	align="end"
	ariaLabel={m.transactions_table_edit_amount()}
	buttonClass="truncate font-currency"
	{onEdit}
>
	{#snippet view()}
		{intlContext.formatCurrency(amount)}
	{/snippet}
	{#snippet edit({ props })}
		<InputCurrency
			bind:ref={inputRef}
			bind:value={$formData.amount}
			{...props}
			intlConfig={{ locale: intlContext.locale, ...intlContext.numberFormatOptions }}
			class="px-2 text-right font-medium"
		/>
	{/snippet}
</TableCellEditable>
