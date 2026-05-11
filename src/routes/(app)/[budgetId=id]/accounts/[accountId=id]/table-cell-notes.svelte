<script lang="ts">
	import type { Row } from '@tanstack/table-core';

	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { m } from '$lib/paraglide/messages';
	import { tick } from 'svelte';

	import type { TransactionRow } from './types';

	import { getTableContext } from './table-context.svelte';

	let { notes, row }: { notes: string; row: Row<TransactionRow> } = $props();

	const tableContext = getTableContext();

	const { form: formData } = tableContext.form;

	let inputRef = $state<HTMLInputElement>(null!);
	function editCell() {
		tableContext.setEditingRow(row);
		tick().then(() => {
			inputRef.focus();
			inputRef.select();
		});
	}
</script>

<div class="grid size-full items-center justify-items-start">
	{#if tableContext.isEditingRow(row.id)}
		<Form.Field form={tableContext.form} name="notes" class="w-full space-y-0">
			<Form.Control>
				{#snippet children({ props })}
					<Input bind:ref={inputRef} class="px-2" bind:value={$formData.notes} {...props} />
				{/snippet}
			</Form.Control>
		</Form.Field>
	{:else}
		<button
			class="flex size-full items-center justify-start truncate border border-transparent px-2"
			onclick={editCell}
			aria-label={m.transactions_table_edit_notes()}
		>
			{notes}
		</button>
	{/if}
</div>
