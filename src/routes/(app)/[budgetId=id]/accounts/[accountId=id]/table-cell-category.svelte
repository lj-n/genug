<script lang="ts">
	import type { Row } from '@tanstack/table-core';

	import * as Form from '$lib/components/ui/form';
	import { SelectCommand } from '$lib/components/ui/select-command';
	import { m } from '$lib/paraglide/messages';

	import type { TransactionRow } from './types';

	import { getTableContext } from './table-context.svelte';

	let { categoryName, row }: { categoryName: string; row: Row<TransactionRow> } = $props();

	const tableContext = getTableContext();

	const { form: formData } = tableContext.form;

	function getValue() {
		return $formData.categoryId ?? '';
	}

	function setValue(newValue: string) {
		$formData.categoryId = newValue;
	}

	let open = $state(false);
	function editCell() {
		tableContext.setEditingRow(row);
		open = true;
	}
</script>

<div class="-mx-2 grid size-full items-center justify-items-start">
	{#if tableContext.isEditingRow(row.id)}
		<Form.Field form={tableContext.form} name="categoryId" class="w-full space-y-0">
			<Form.Control>
				{#snippet children({ props })}
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
			</Form.Control>
		</Form.Field>
	{:else}
		<button
			class="flex size-full items-center justify-start border border-transparent px-2"
			onclick={editCell}
		>
			{categoryName}
		</button>
	{/if}
</div>
