<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import { type ComponentProps, tick } from 'svelte';
	import { flip } from 'svelte/animate';
	import { SvelteSet } from 'svelte/reactivity';
	import { fly } from 'svelte/transition';
	import { cn } from 'tailwind-variants';

	import { type FilterComponent, getTableContext } from './table-context.svelte';

	let { footer, header }: ComponentProps<FilterComponent> = $props();

	const tableContext = getTableContext();

	const filter = tableContext.filter();

	const initialData = filter.categoryId !== undefined ? [filter.categoryId].flat() : undefined;

	let selected = new SvelteSet<string>(initialData);

	let buttonRefs = $state<Record<string, HTMLButtonElement>>({});

	let sortedCategories = $derived(
		[...tableContext.categories()].sort((a, b) => +selected.has(b.id) - +selected.has(a.id))
	);

	function toggle(id: string) {
		if (selected.has(id)) {
			selected.delete(id);
		} else {
			selected.add(id);
		}
		tick().then(() => {
			buttonRefs[id]?.focus();
		});
	}
</script>

{@render header({
	description: m.transaction_filter_category_description(),
	title: m.transaction_filter_category_title()
})}

<ul class="flex flex-wrap gap-1.5">
	{#each sortedCategories as category (category.id)}
		<li animate:flip={{ duration: 150 }}>
			<button
				bind:this={buttonRefs[category.id]}
				onclick={() => toggle(category.id)}
				class={cn(
					'rounded-full border border-muted/10 bg-muted/5 px-2 text-sm',
					selected.has(category.id) && 'border-info bg-info/10 text-info shadow-xs shadow-info/20'
				)}
			>
				{category.name}
			</button>
		</li>
	{/each}
</ul>

<div class="-mb-6 h-9">
	{#if selected.size > 0}
		<div transition:fly={{ duration: 150, x: -20 }}>
			<Button
				variant="destructive"
				size="xs"
				class="w-fit"
				onclick={() => {
					selected.clear();
				}}
			>
				{m.transaction_filter_category_deselect_all()}
			</Button>
		</div>
	{/if}
</div>

{@render footer({
	setParams: () => {
		tableContext.setFilterParams({
			categoryId: selected.values().toArray()
		});
	}
})}
