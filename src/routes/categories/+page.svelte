<script lang="ts">
	import { flip } from 'svelte/animate';
	import type { PageData } from './$types';
	import { dragHandleZone, dragHandle, type DndEvent } from 'svelte-dnd-action';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import LucideGripVertical from '~icons/lucide/grip-vertical';

	export let data: PageData;

	$: activeCategories = data.categories.filter((category) => !category.retired);
	$: retiredCategories = data.categories.filter((category) => category.retired);

	function handleSort({
		detail
	}: CustomEvent<DndEvent<PageData['categories'][number]>>) {
		activeCategories = detail.items;
	}

	async function handleFinalize({
		detail
	}: CustomEvent<DndEvent<PageData['categories'][number]>>) {
		try {
			const formData = new FormData();
			formData.append('order', detail.items.map((c) => c.id).join(','));
			console.log(formData.get('order'));
			const res = await fetch('/categories?/saveOrder', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					// 'x-sveltekit-action': 'true'
				},
				body: formData
			});

			const json = await res.json();
			console.log(json);
		} catch (err) {
			console.error(err);
		}
	}

	const flipDurationMs = 200;
</script>

<svelte:head>
	<title>Categories</title>
</svelte:head>

<h1 class="mb-6 scroll-m-20 text-2xl font-bold tracking-tight lg:text-3xl">
	Categories
</h1>

<div
	class="flex max-w-4xl flex-col gap-2"
	use:dragHandleZone={{
		items: activeCategories,
		flipDurationMs,
		dropTargetStyle: {}
	}}
	on:consider={handleSort}
	on:finalize={handleFinalize}
>
	{#each activeCategories as category (category.id)}
		<div
			animate:flip={{ duration: flipDurationMs }}
			class="flex rounded-xl border bg-background p-4"
		>
			<div class="flex flex-col">
				<span class="font-semibold">{category.name}</span>
				<span class="text-secondary-foreground"
					>{category.description ?? '~'}</span
				>
			</div>

			<div class="ml-auto flex items-center gap-4">
				<Button variant="outline" size="sm" href="/categories/{category.id}">
					More Details
				</Button>

				<button
					class={buttonVariants({ variant: 'ghost', size: 'icon' })}
					use:dragHandle
				>
					<LucideGripVertical />
					<span class="sr-only">Reorder Category</span>
				</button>
			</div>
		</div>
	{/each}
</div>
