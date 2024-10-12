<script lang="ts">
	import Feather from '$lib/components/feather.svelte';
	import { flip } from 'svelte/animate';
	import type { PageData } from './$types';
	import { scale } from 'svelte/transition';

	import CategoryCard from './category.card.svelte';

	export let data: PageData;

	$: activeCategories = data.categories.filter((category) => !category.retired);
	$: retiredCategories = data.categories.filter((category) => category.retired);
</script>

<svelte:head>
	<title>Categories</title>
</svelte:head>

<div class="flex flex-wrap gap-8 py-8">
	<div class="grow">
		<h1 class="text-2xl font-bold">Categories</h1>
		<div class="mt-8 flex flex-col gap-1">
			{#each activeCategories as category, i (category.id)}
				<div animate:flip={{ duration: 150 }} transition:scale>
					<CategoryCard
						index={i}
						currentOrder={activeCategories.map((c) => c.id)}
						{category}
					/>
				</div>
			{/each}

			{#if retiredCategories.length}
				<details class="group mt-8">
					<summary
						class="flex cursor-pointer select-none list-none items-center gap-2"
					>
						<Feather
							name="chevron-down"
							class="hidden text-lg text-orange group-open:block"
						/>
						<Feather
							name="chevron-right"
							class="block text-lg group-open:hidden"
						/>
						<h2 class="text-lg font-semibold text-muted">Retired Categories</h2>
					</summary>

					<div class="mt-4 flex flex-col gap-1">
						{#each retiredCategories as category (category.id)}
							<div animate:flip={{ duration: 150 }} transition:scale>
								<CategoryCard {category} />
							</div>
						{/each}
					</div>
				</details>
			{/if}
		</div>
	</div>
</div>
