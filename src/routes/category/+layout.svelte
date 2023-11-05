<script lang="ts">
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';
	import Feather from '$lib/components/feather.svelte';
	import { flip } from 'svelte/animate';
	import { scale } from 'svelte/transition';

	export let data: LayoutData;
</script>

<div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
	<div class="flex flex-col gap-2 md:max-h-[40rem] md:overflow-y-auto md:sticky md:top-20">
		<h2 class="sticky top-0 bg-neutral-100">Your Categories</h2>
		<p>Select for more details.</p>
		{#each data.categories as category (category.id)}
			<a
				href="/category/{category.id}#category-{category.id}"
				class="btn bg-neutral-50 border justify-between rounded-md p-2"
				class:border-indigo-400={+$page.params.id === category.id}
				animate:flip
				transition:scale
			>
				{category.name}

				{#if +$page.params.id === category.id}
					<Feather name="chevron-right" class="text-indigo-400" />
				{/if}
			</a>
		{/each}
	</div>

	<slot />
</div>
