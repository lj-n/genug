<script lang="ts">
	import type { Row } from '@tanstack/table-core';

	import * as Form from '$lib/components/ui/form';
	import { SelectCommand } from '$lib/components/ui/select-command';
	import { m } from '$lib/paraglide/messages';
	import { cn } from 'tailwind-variants';

	import type { TransactionRow } from './types';

	import { getTableContext } from './table-context.svelte';

	let { categoryName, row }: { categoryName: string; row: Row<TransactionRow> } = $props();

	const tableContext = getTableContext();

	const { form: formData } = tableContext.form;

	function getValue() {
		return $formData.categoryId ?? 'null';
	}

	function setValue(value: string) {
		$formData.categoryId = value === 'null' ? null : value;
	}

	let open = $state(false);
	function editCell() {
		tableContext.setEditingRow(row);
		open = true;
	}

	let withoutCategory = $derived(categoryName === null);
</script>

<div class="grid size-full items-center justify-items-start">
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
			class={cn(
				'flex size-full items-center justify-start gap-2 border border-transparent px-2',
				withoutCategory && 'text-muted'
			)}
			onclick={editCell}
			aria-label={m.transactions_table_edit_category()}
		>
			{withoutCategory ? m.transaction_table_cell_category_empty() : categoryName}
		</button>
	{/if}
</div>
