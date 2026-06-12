<script lang="ts">
	import type { Snippet } from 'svelte';

	import { m } from '$lib/paraglide/messages';
	import { getCategoriesFlat } from '$lib/remote-functions/category.remote';
	import { flip } from 'svelte/animate';
	import { SvelteSet } from 'svelte/reactivity';
	import { fly } from 'svelte/transition';

	let {
		budgetId,
		currentCategoryIds = [],
		footer,
		header,
		onApply
	}: {
		budgetId: string;
		currentCategoryIds: string[];
		footer: Snippet<[{ setParams: () => void }]>;
		header: Snippet<[{ description: string; title: string }]>;
		onApply: (categoryIds: string[]) => void;
	} = $props();

	const categories = $derived(await getCategoriesFlat({ budgetId }));

	// svelte-ignore state_referenced_locally
	let selected = new SvelteSet<string>(currentCategoryIds);

	let sortedCategories = $derived(
		[...categories].sort((a, b) => +selected.has(b.id) - +selected.has(a.id))
	);

	function toggle(id: string) {
		if (selected.has(id)) {
			selected.delete(id);
		} else {
			selected.add(id);
		}
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
				onclick={() => toggle(category.id)}
				class={[
					'rounded-full border border-muted/10 bg-muted/5 px-2 text-sm',
					selected.has(category.id) && 'border-info bg-info/10 text-info shadow-xs shadow-info/20'
				].join(' ')}
			>
				{category.name}
			</button>
		</li>
	{/each}
</ul>

{#if selected.size > 0}
	<div transition:fly={{ duration: 150, x: -20 }}>
		<p>
			<button class="text-destructive text-sm hover:underline" onclick={() => selected.clear()}>
				{m.transaction_filter_category_deselect_all()}
			</button>
		</p>
	</div>
{/if}

{@render footer({
	setParams: () => {
		onApply(selected.values().toArray());
	}
})}
