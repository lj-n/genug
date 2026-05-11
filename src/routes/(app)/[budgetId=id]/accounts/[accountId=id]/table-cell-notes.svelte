<script lang="ts">
	import type { Row } from '@tanstack/table-core';

	import { Input } from '$lib/components/ui/input';
	import { m } from '$lib/paraglide/messages';
	import { tick } from 'svelte';

	import type { TransactionRow } from './types';

	import TableCellEditable from './table-cell-editable.svelte';
	import { getTableContext } from './table-context.svelte';

	let { notes, row }: { notes: string; row: Row<TransactionRow> } = $props();

	const tableContext = getTableContext();
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
	name="notes"
	align="start"
	ariaLabel={m.transactions_table_edit_notes()}
	buttonClass="truncate"
	{onEdit}
>
	{#snippet view()}
		{notes}
	{/snippet}
	{#snippet edit({ props })}
		<Input bind:ref={inputRef} class="px-2" bind:value={$formData.notes} {...props} />
	{/snippet}
</TableCellEditable>
