<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { m } from '$lib/paraglide/messages';
	import HashDuotoneIcon from '~icons/ph/hash-duotone';

	import CategoryDetail from './category-detail.svelte';

	let { categoryId = $bindable() }: { categoryId: null | string } = $props();

	// Writable derived: bits-ui flips this locally on close so the exit
	// transition can play; the bound id is reset afterwards.
	let open = $derived(categoryId !== null);
</script>

<Dialog.Root bind:open onOpenChangeComplete={(isOpen) => !isOpen && (categoryId = null)}>
	<Dialog.Content class="max-w-4xl">
		{#if categoryId !== null}
			<div class="@container flex w-full flex-col gap-6">
				<Dialog.Title class="flex items-center gap-2 tracking-tighter italic">
					<span class="text-xl font-semibold">{m.category_detail_title()}</span>

					<span
						class="flex items-center gap-0.5 rounded-md bg-info/10 px-1 font-mono text-sm text-info"
					>
						<HashDuotoneIcon />
						{categoryId}
					</span>
				</Dialog.Title>

				<CategoryDetail {categoryId} />
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
