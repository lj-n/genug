<script lang="ts">
	import type { Row } from '@tanstack/table-core';

	import * as Form from '$lib/components/ui/form';
	import { InputCurrency } from '$lib/components/ui/input-currency';
	import { m } from '$lib/paraglide/messages';
	import { getIntlContext } from '$lib/utils/intl-context.svelte';
	import { tick } from 'svelte';

	import type { TransactionRow } from './types';

	import { getTableContext } from './table-context.svelte';

	let { amount, row }: { amount: number; row: Row<TransactionRow> } = $props();

	const tableContext = getTableContext();
	const intlContext = getIntlContext();

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

<div class="grid size-full items-center justify-items-end">
	{#if tableContext.isEditingRow(row.id)}
		<Form.Field form={tableContext.form} name="amount" class="w-full space-y-0">
			<Form.Control>
				{#snippet children({ props })}
					<InputCurrency
						bind:ref={inputRef}
						bind:value={$formData.amount}
						{...props}
						intlConfig={{ locale: intlContext.locale, ...intlContext.numberFormatOptions }}
						class="px-2 text-right font-medium"
					/>
				{/snippet}
			</Form.Control>
		</Form.Field>
	{:else}
		<button
			class="flex size-full items-center justify-end truncate border border-transparent px-2 font-currency"
			onclick={editCell}
			aria-label={m.transactions_table_edit_amount()}
		>
			{intlContext.formatCurrency(amount)}
		</button>
	{/if}
</div>
