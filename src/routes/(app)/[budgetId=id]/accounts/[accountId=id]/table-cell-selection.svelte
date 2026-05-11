<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox, type WithoutChildrenOrChild } from 'bits-ui';
	import PhCircleDashedDuotone from '~icons/ph/circle-dashed-duotone';
	import PhCircleDashedLight from '~icons/ph/circle-dashed-light';
	import PhMinusCircleDuotone from '~icons/ph/minus-circle-duotone';

	import { getTableContext } from './table-context.svelte';

	let {
		checked = $bindable(false),
		ref = $bindable(null),
		...restProps
	}: WithoutChildrenOrChild<Checkbox.RootProps> = $props();

	const tableContext = getTableContext();

	let disabled = $derived(tableContext.editingRowId !== null);
</script>

<div class="grid place-content-center">
	<Label
		class={buttonVariants({
			class: 'rounded-xs hover:bg-transparent',
			size: 'icon-lg',
			variant: 'ghost'
		})}
	>
		<Checkbox.Root
			bind:checked
			bind:ref
			{...restProps}
			{disabled}
			aria-disabled={disabled}
			class="cursor-pointer text-muted aria-checked:text-info aria-disabled:cursor-auto aria-disabled:opacity-50"
		>
			{#snippet children({ checked, indeterminate })}
				{#if checked}
					<PhCircleDashedDuotone class="size-5" />
				{:else if indeterminate}
					<PhMinusCircleDuotone class="size-5" />
				{:else}
					<PhCircleDashedLight class="size-5" />
				{/if}
			{/snippet}
		</Checkbox.Root>
	</Label>
</div>
