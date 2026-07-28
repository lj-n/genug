<script lang="ts">
	// PROTOTYPE (#334) — throwaway. Mobile take: archived categories in a
	// bottom drawer; same slim rows + text-link restore as the locked desktop
	// popover (round-4 C). Replaces the old archived-page link in the @max-3xl
	// action row.
	import type { getArchivedCategories } from '$lib/remote-functions/category.remote';

	import { Button } from '$lib/components/ui/button';
	import * as Drawer from '$lib/components/ui/drawer';
	import { m } from '$lib/paraglide/messages';
	import { flip } from 'svelte/animate';
	import ArchiveIcon from '~icons/ph/archive';

	import PrototypeRestoreForm from './prototype-restore-form.svelte';

	let { categories }: { categories: Awaited<ReturnType<typeof getArchivedCategories>> } = $props();

	let open = $state(false);

	// Restoring the last category removes the trigger; the open drawer must
	// vanish with it instead of lingering as an empty shell.
	$effect(() => {
		if (categories.length === 0) open = false;
	});
</script>

{#if categories.length > 0}
	<Drawer.Root bind:open>
		<Drawer.Trigger>
			{#snippet child({ props })}
				<Button {...props} variant="ghost" class="h-11">
					<ArchiveIcon class="size-6" />
					{m.category_archived_link({ amount: categories.length })}
				</Button>
			{/snippet}
		</Drawer.Trigger>

		<Drawer.Content>
			<Drawer.Header>
				<Drawer.Title class="flex items-center justify-center gap-1.5">
					<ArchiveIcon class="size-4 shrink-0" />
					{m.category_archive_title()}
					<span class="text-xs font-normal text-muted">{categories.length}</span>
				</Drawer.Title>
			</Drawer.Header>

			<Drawer.Body class="px-4">
				<ul class="flex flex-col gap-0.5">
					{#each categories as category (category.id)}
						<li
							animate:flip={{ duration: 200 }}
							class="flex items-center justify-between gap-3 rounded-sm px-2 py-1.5"
						>
							<span class="line-clamp-1">{category.name}</span>
							<PrototypeRestoreForm {category} style="link" />
						</li>
					{/each}
				</ul>
			</Drawer.Body>
		</Drawer.Content>
	</Drawer.Root>
{/if}
