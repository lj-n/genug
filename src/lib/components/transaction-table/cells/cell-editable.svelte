<script lang="ts">
	import type { Row } from '@tanstack/table-core';
	import type { Snippet } from 'svelte';

	import * as Form from '$lib/components/ui/form';
	import { cn } from 'tailwind-variants';

	import type { TransactionEditFieldName, TransactionRow } from '../types';

	import { getTableContext } from '../context.svelte';

	let {
		align = 'start',
		ariaLabel,
		buttonClass,
		edit,
		name,
		onEdit,
		row,
		view
	}: {
		align?: 'end' | 'start';
		ariaLabel: string;
		buttonClass?: string;
		edit: Snippet<[{ props: Record<string, unknown> }]>;
		name: TransactionEditFieldName;
		onEdit?: () => void;
		row: Row<TransactionRow>;
		view: Snippet;
	} = $props();

	const tableContext = getTableContext();

	function editCell() {
		tableContext.setEditingRow(row.id);
		onEdit?.();
	}
</script>

<div
	class={cn(
		'grid size-full items-center',
		align === 'start' ? 'justify-items-start' : 'justify-items-end'
	)}
>
	{#if tableContext.isEditingRow(row.id)}
		<Form.Field form={tableContext.editForm} {name} class="w-full space-y-0">
			<Form.Control>
				{#snippet children({ props })}
					{@render edit({ props })}
				{/snippet}
			</Form.Control>
		</Form.Field>
	{:else}
		<button
			class={cn(
				'flex size-full items-center border border-transparent px-2',
				align === 'start' ? 'justify-start' : 'justify-end',
				buttonClass
			)}
			onclick={editCell}
			aria-label={ariaLabel}
		>
			{@render view()}
		</button>
	{/if}
</div>
