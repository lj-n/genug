<script lang="ts">
	import type { Row } from '@tanstack/table-core';

	import { SelectCommand } from '$lib/components/ui/select-command';
	import { m } from '$lib/paraglide/messages';
	import { cn } from 'tailwind-variants';

	import type { TransactionRow } from './types';

	import TableCellEditable from './table-cell-editable.svelte';
	import { getTableContext } from './table-context.svelte';

	let { categoryName, row }: { categoryName: string; row: Row<TransactionRow> } = $props();

	const tableContext = getTableContext();
	const { form: formData } = tableContext.form;

	let open = $state(false);

	let withoutCategory = $derived(categoryName === null);

	function getValue() {
		return $formData.categoryId ?? 'null';
	}

	function setValue(value: string) {
		$formData.categoryId = value === 'null' ? null : value;
	}
</script>

<TableCellEditable
	{row}
	name="categoryId"
	align="start"
	ariaLabel={m.transactions_table_edit_category()}
	buttonClass={cn('gap-2', withoutCategory && 'text-muted')}
	onEdit={() => {
		open = true;
	}}
>
	{#snippet view()}
		{withoutCategory ? m.transaction_table_cell_category_empty() : categoryName}
	{/snippet}
	{#snippet edit({ props })}
		<SelectCommand
			bind:open
			bind:value={getValue, setValue}
			items={tableContext.categories}
			triggerProps={props}
			textEmptyTrigger={m.transaction_table_cell_category_empty()}
			textInputPlaceholder={m.transaction_table_cell_category_placeholder()}
			textListEmpty={m.transaction_table_cell_category_empty()}
		/>
	{/snippet}
</TableCellEditable>
