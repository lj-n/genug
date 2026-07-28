<script lang="ts">
	// PROTOTYPE (#334) — Variant C (round 4): text-link rows in the budget
	// table's popover chrome — panel overlays the trigger (negative offset), a
	// tinted title strip repeats the archive icon at its exact anchor position
	// with the title beside it, mirroring category-popover.svelte.
	import type { getArchivedCategories } from '$lib/remote-functions/category.remote';

	import * as Popover from '$lib/components/ui/popover';
	import { m } from '$lib/paraglide/messages';
	import { flip } from 'svelte/animate';
	import ArchiveIcon from '~icons/ph/archive';

	import PrototypeRestoreForm from './prototype-restore-form.svelte';

	let {
		categories,
		triggerHeight
	}: {
		categories: Awaited<ReturnType<typeof getArchivedCategories>>;
		triggerHeight: number;
	} = $props();
</script>

<Popover.Content
	side="bottom"
	align="start"
	sideOffset={-triggerHeight}
	motion="fade"
	class="w-64 gap-0 overflow-hidden rounded-xs bg-surface p-0 shadow-sm ring-1 ring-muted/30"
>
	<!-- Title strip mirrors the trigger button — same inset and height — so the
	     archive icon doesn't shift when the panel opens over it. -->
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
				<PrototypeRestoreForm {category} style="link" />
			</li>
		{/each}
	</ul>
</Popover.Content>
