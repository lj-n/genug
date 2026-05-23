<script lang="ts">
	import type { Row } from '@tanstack/table-core';

	import { invalidateAll } from '$app/navigation';
	import * as Form from '$lib/components/ui/form';
	import { m } from '$lib/paraglide/messages';

	import type { TransactionRow } from '../types';

	import { getTableContext } from '../context.svelte';
	import ValidateCheckbox from './validate-checkbox.svelte';

	let { isValidated, row }: { isValidated: boolean; row: Row<TransactionRow> } = $props();

	const tableContext = getTableContext();

	const { form: formData } = tableContext.editForm;

	function toggleValidated() {
		fetch('/api/transaction/validate', {
			body: JSON.stringify({
				transactionIds: [row.id],
				validated: !isValidated
			}),
			method: 'POST'
		}).then((res) => {
			if (res.ok) {
				invalidateAll();
				isValidated = !isValidated;
			}
		});
	}
</script>

<div class="grid size-full place-content-center">
	{#if tableContext.isEditingRow(row.id)}
		<Form.Field form={tableContext.editForm} name="validated">
			<Form.Control>
				{#snippet children({ props })}
					<ValidateCheckbox bind:checked={$formData.validated} {...props} />
				{/snippet}
			</Form.Control>
		</Form.Field>
	{:else}
		<ValidateCheckbox
			checked={isValidated}
			onclick={toggleValidated}
			aria-label={m.transactions_table_toggle_validated()}
		/>
	{/if}
</div>
