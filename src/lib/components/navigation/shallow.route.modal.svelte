<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Drawer from '$lib/components/ui/drawer';
	import { mediaQuery } from 'svelte-legos';

	export let open: boolean;
	export let close: () => void;

	$: onOpenChange = (open: boolean) => {
		if (!open) {
			close();
		}
	};

	const isDesktop = mediaQuery('(min-width: 768px)');
</script>

{#if $isDesktop}
	<Dialog.Root bind:open {onOpenChange}>
		<Dialog.Content class="sm:max-w-md">
			<slot />
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<Drawer.Root bind:open {onOpenChange}>
		<Drawer.Content>
			<slot />
		</Drawer.Content>
	</Drawer.Root>
{/if}
