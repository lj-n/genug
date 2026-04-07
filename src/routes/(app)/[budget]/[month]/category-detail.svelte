<script lang="ts">
	import type { Snippet } from 'svelte';

	import * as Dialog from '$lib/components/ui/dialog';
	import { fly } from 'svelte/transition';
	import PhFloppyDiskDuotone from '~icons/ph/floppy-disk-duotone';

	import type { PageData } from './$types';

	type CategoryDetailProps = {
		category: null | PageData['categories'][number];
		child: Snippet<[{ category: PageData['categories'][number] }]>;
	};

	let { category = $bindable(null), child }: CategoryDetailProps = $props();

	let open = $state(category !== null);

	$effect(() => {
		if (category) {
			open = true;
		}
	});
</script>

<Dialog.Root
	bind:open
	onOpenChangeComplete={(open) => {
		if (!open) {
			category = null;
		}
	}}
>
	<Dialog.Content class="max-w-4xl">
		<Dialog.Header class="flex-row">
			<Dialog.Title class="font-mono text-muted">#Category</Dialog.Title>

			{#if true}
				<div
					class="absolute top-6 left-1/2 flex -translate-x-1/2 items-center gap-1 font-medium text-success"
					transition:fly={{ y: 20 }}
				>
					<PhFloppyDiskDuotone />
					<span>Saved</span>
				</div>
			{/if}
		</Dialog.Header>

		{#if category}
			{@render child({ category })}
		{/if}
	</Dialog.Content>
</Dialog.Root>
