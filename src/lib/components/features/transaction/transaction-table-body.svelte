<script lang="ts" generics="Item extends { id: string }">
	import type { Snippet } from 'svelte';

	let {
		createrow,
		data,
		row
	}: {
		createrow?: Snippet;
		data: Item[];
		row: Snippet<
			[{ cancelEditing: () => void; isEditing: boolean; item: Item; setEditing: () => void }]
		>;
	} = $props();

	let editRowId: null | string = $state(null);
</script>

<div role="rowgroup" class="grid space-y-1.5">
	{@render createrow?.()}

	{#each data as item (item.id)}
		{@render row({
			cancelEditing: () => {
				editRowId = null;
			},
			isEditing: item.id === editRowId,
			item,
			setEditing: () => {
				editRowId = item.id;
			}
		})}
	{/each}
</div>
