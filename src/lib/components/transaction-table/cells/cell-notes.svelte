<script lang="ts">
	import type { Row } from '@tanstack/table-core';

	import { Input } from '$lib/components/ui/input';
	import { m } from '$lib/paraglide/messages';
	import { focusAndSelect } from '$lib/utils/focus-and-select';

	import type { TransactionRow } from '../types';

	import { getTableContext } from '../context.svelte';
	import CellEditable from './cell-editable.svelte';

	let { notes, row }: { notes: string; row: Row<TransactionRow> } = $props();

	const tableContext = getTableContext();
	const { form: formData } = tableContext.editForm;

	let inputRef = $state<HTMLInputElement>(null!);
</script>

<CellEditable
	{row}
	name="notes"
	align="start"
	ariaLabel={m.transactions_table_edit_notes()}
	buttonClass="truncate"
	onEdit={() => focusAndSelect(inputRef)}
>
	{#snippet view()}
		{notes}
	{/snippet}
	{#snippet edit({ props })}
		<Input bind:ref={inputRef} class="px-2" bind:value={$formData.notes} {...props} />
	{/snippet}
</CellEditable>
