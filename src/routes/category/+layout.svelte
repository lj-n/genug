<script lang="ts">
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';
	import Feather from '$lib/components/feather.svelte';
	import { flip } from 'svelte/animate';
	import { scale } from 'svelte/transition';

	export let data: LayoutData;
</script>

<div class="grid grid-cols-1 md:grid-cols-4 gap-2 mb-8 py-4">
	<div
		class="flex flex-col gap-2 md:max-h-[40rem] md:overflow-y-auto md:sticky md:top-14 md:pr-2"
	>
		<a
			href={$page.params.id ? '/category' : '/'}
			class="btn btn-sm mr-auto hover:bg-ui"
		>
			<Feather name="arrow-left" />
			go back
		</a>

		<h2>Your Categories</h2>
		<p>Select for more details.</p>

		{#each data.categories as category (category.id)}
			<a
				href="/category/{category.id}#category-{category.id}"
				class="btn btn-ghost justify-start rounded-lg px-4 border border-ui"
				class:bg-bg-2={+$page.params.id === category.id}
				animate:flip
				transition:scale
			>
				{#if +$page.params.id === category.id}
					<Feather name="chevron-right" class="text-blue-light" />
				{/if}

				{category.name}
			</a>
		{/each}
	</div>

	<div class="col-span-1 md:col-span-3 p-8 flex flex-col">
		{#key $page}
			<slot />
		{/key}
	</div>
</div>
