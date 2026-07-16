<script lang="ts">
	import * as Select from '$lib/components/ui/select';
	import { UNASSIGNED } from '$lib/constants';
	import { m } from '$lib/paraglide/messages';
	import { getCategories } from '$lib/remote-functions/category.remote';

	let {
		budgetId,
		elementRef = $bindable(null),
		onchange,
		value = $bindable([])
	}: {
		budgetId: string;
		elementRef?: HTMLButtonElement | null;
		onchange: (value: string[]) => void;
		value: string[];
	} = $props();

	const categories = $derived(await getCategories({ budgetId }));
</script>

<Select.Root type="multiple" bind:value onValueChange={onchange}>
	<Select.Trigger bind:ref={elementRef} class="w-fit max-w-full @3xl/main:min-w-xs">
		{#if value.length}
			{m.transaction_filter_category_selected({ selected: value.length })}
		{:else}
			{m.transaction_filter_category_empty()}
		{/if}
	</Select.Trigger>

	<Select.Content class="max-h-75">
		<Select.Item value={UNASSIGNED}>{m.transaction_filter_category_without()}</Select.Item>

		{#each categories as category (category.id)}
			<Select.Item value={category.id}>{category.name}</Select.Item>
		{/each}
	</Select.Content>
</Select.Root>
