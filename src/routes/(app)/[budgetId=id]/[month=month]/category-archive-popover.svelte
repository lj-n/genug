<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import { m } from '$lib/paraglide/messages';
	import { getArchivedCategories } from '$lib/remote-functions/category.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import { flip } from 'svelte/animate';
	import ArchiveIcon from '~icons/ph/archive';

	import CategoryRestoreForm from './category-restore-form.svelte';

	const budgetId = getBudgetId();
	const categories = $derived(await getArchivedCategories({ budgetId: budgetId() }));

	// Trigger height measured live (category-popover.svelte pattern) so the
	// overlay panel's title strip can pixel-lock the icon at its anchor spot.
	let triggerEl = $state<HTMLElement | null>(null);
	let triggerHeight = $state(0);
	$effect(() => {
		if (!triggerEl) return;
		const observer = new ResizeObserver(() => (triggerHeight = triggerEl!.offsetHeight));
		observer.observe(triggerEl);
		return () => observer.disconnect();
	});
</script>

<!-- Restoring the last category unmounts the whole root, open panel included,
     so no explicit close is needed at zero. -->
{#if categories.length > 0}
	<Popover.Root>
		<Popover.Trigger
			bind:ref={triggerEl}
			class={buttonVariants({ size: 'xs', variant: 'ghost' })}
			aria-label={m.category_archived_link({ amount: categories.length })}
		>
			<ArchiveIcon class="size-4" />
		</Popover.Trigger>

		<Popover.Content
			side="bottom"
			align="start"
			sideOffset={-triggerHeight}
			motion="fade"
			class="w-64 gap-0 overflow-hidden rounded-xs bg-surface p-0 shadow-sm ring-1 ring-muted/30"
		>
			<!-- Title strip mirrors the trigger button — same inset and height — so
			     the archive icon doesn't shift when the panel opens over it. -->
			<div
				class="flex items-center gap-1.5 border-b border-muted/20 bg-muted/5 px-2"
				style="min-height: {triggerHeight}px"
			>
				<ArchiveIcon class="size-4 shrink-0" />
				<Popover.Title class="truncate text-sm">{m.category_archive_title()}</Popover.Title>
				<span class="ml-auto text-xs text-muted">{categories.length}</span>
			</div>

			<ul class="flex max-h-48 flex-col gap-0.5 overflow-y-auto p-1">
				{#each categories as category (category.id)}
					<li
						animate:flip={{ duration: 200 }}
						class="flex items-center justify-between gap-2 rounded-sm px-2 py-0.5 hover:bg-muted/5"
					>
						<span class="line-clamp-1">{category.name}</span>
						<CategoryRestoreForm {category} />
					</li>
				{/each}
			</ul>
		</Popover.Content>
	</Popover.Root>
{/if}
