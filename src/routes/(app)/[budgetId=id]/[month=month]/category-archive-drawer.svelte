<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Drawer from '$lib/components/ui/drawer';
	import { m } from '$lib/paraglide/messages';
	import { getArchivedCategories } from '$lib/remote-functions/category.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import { flip } from 'svelte/animate';
	import ArchiveIcon from '~icons/ph/archive';

	import CategoryRestoreForm from './category-restore-form.svelte';

	const budgetId = getBudgetId();
	const categories = $derived(await getArchivedCategories({ budgetId: budgetId() }));
</script>

<!-- Restoring the last category unmounts the whole root, open drawer included,
     so no explicit close is needed at zero. -->
{#if categories.length > 0}
	<Drawer.Root>
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
							<CategoryRestoreForm {category} />
						</li>
					{/each}
				</ul>
			</Drawer.Body>
		</Drawer.Content>
	</Drawer.Root>
{/if}
