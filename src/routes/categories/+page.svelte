<script lang="ts">
	import { flip } from 'svelte/animate';
	import type { PageData } from './$types';
	import { dragHandleZone, dragHandle, type DndEvent } from 'svelte-dnd-action';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import LucideGripVertical from '~icons/lucide/grip-vertical';

	export let data: PageData;

	type TeamId = number;

	$: groupedCategories = data.categories.reduce((acc, row) => {
		const teamId = row.team?.id ?? null;
		if (acc.has(teamId)) {
			acc.get(teamId)?.push(row);
		} else {
			acc.set(teamId, [row]);
		}
		return acc;
	}, new Map<null | TeamId, PageData['categories']>());

	/**
	 * Sort grouped categories by team name, with personal categories (key==null) first
	 */
	$: sortedGroupedCategories = new Map(
		[...groupedCategories.entries()].sort(([key]) => {
			if (key === null) return -1;
			return 1;
		})
	);

	function handleSort({
		detail
	}: CustomEvent<DndEvent<PageData['categories'][number]>>) {
		data.categories = detail.items;
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
					'Content-Type': 'application/x-www-form-urlencoded'
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

<h1 class="scroll-m-20 text-2xl font-bold tracking-tight lg:text-3xl">
	Categories
</h1>

{#each sortedGroupedCategories.entries() as [teamId, categories]}
	{@const team = data.teams.find((t) => t.id === teamId)}
	<h2 class="mb-4 mt-6 text-lg font-bold tracking-tight lg:text-xl">
		{team?.name ?? 'Personal'}
	</h2>

	<div
		class="flex max-w-4xl flex-col"
		use:dragHandleZone={{
			items: categories,
			flipDurationMs,
			dropTargetStyle: {},
		}}
		on:consider={handleSort}
		on:finalize={handleFinalize}
	>
		{#each categories as category (category.id)}
			<div
				animate:flip={{ duration: flipDurationMs }}
				class="flex border-t border-secondary bg-background p-1 first:border-none"
			>
				<div class="flex flex-col">
					<span class="font-semibold">{category.name}</span>
					<span class="text-secondary-foreground">
						{category.description ?? '~'}
					</span>
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
{/each}
