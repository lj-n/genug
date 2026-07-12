<script lang="ts">
	import * as ResponsiveModal from '$lib/components/ui/responsive-modal';
	import { m } from '$lib/paraglide/messages';
	import HashDuotoneIcon from '~icons/ph/hash-duotone';

	import CategoryDetail from './category-detail.svelte';

	let {
		categoryId = $bindable(),
		open = $bindable(false)
	}: { categoryId: null | string; open?: boolean } = $props();

	// Deleting a category from the detail view removes it entirely, so the
	// dialog must close itself — flipping `open` plays the exit transition and
	// `onOpenChangeComplete` clears the bound id.
	function close() {
		open = false;
	}
</script>

<ResponsiveModal.Root bind:open onOpenChangeComplete={(isOpen) => !isOpen && (categoryId = null)}>
	<ResponsiveModal.Content class="max-w-4xl">
		{#if categoryId !== null}
			<div class="@container flex w-full flex-col gap-6">
				<ResponsiveModal.Title class="flex items-center gap-2 tracking-tighter italic">
					<span class="text-xl font-semibold">{m.category_detail_title()}</span>

					<span
						class="flex items-center gap-0.5 rounded-md bg-info/10 px-1 font-mono text-sm text-info"
					>
						<HashDuotoneIcon />
						{categoryId}
					</span>
				</ResponsiveModal.Title>

				<CategoryDetail {categoryId} onDeleted={close} />
			</div>
		{/if}
	</ResponsiveModal.Content>
</ResponsiveModal.Root>
