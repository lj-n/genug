<script lang="ts">
	// PROTOTYPE (#334) — Variant B (round 3): A's chrome; the whole row is the
	// restore button, with an always-visible muted "Restore" label that turns
	// interactive on hover/focus.
	import type { getArchivedCategories } from '$lib/remote-functions/category.remote';

	import * as Popover from '$lib/components/ui/popover';
	import { m } from '$lib/paraglide/messages';
	import { flip } from 'svelte/animate';

	import PrototypeRestoreForm from './prototype-restore-form.svelte';

	let { categories }: { categories: Awaited<ReturnType<typeof getArchivedCategories>> } = $props();
</script>

<Popover.Content side="right" align="start" class="w-64 gap-1 p-2">
	<div class="flex items-baseline justify-between gap-2 px-2 pt-1 pb-0.5">
		<Popover.Title>{m.category_archive_title()}</Popover.Title>
		<span class="text-xs text-muted">{categories.length}</span>
	</div>

	<ul class="flex max-h-48 flex-col gap-0.5 overflow-y-auto">
		{#each categories as category (category.id)}
			<li animate:flip={{ duration: 200 }}>
				<PrototypeRestoreForm {category} style="row" />
			</li>
		{/each}
	</ul>
</Popover.Content>
