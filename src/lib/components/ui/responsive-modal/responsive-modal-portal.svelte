<script lang="ts">
	import type { Snippet } from 'svelte';

	import * as Dialog from '$lib/components/ui/dialog';
	import * as Drawer from '$lib/components/ui/drawer';

	import { getResponsiveModalContext } from './context';

	let { children }: { children?: Snippet } = $props();

	const ctx = getResponsiveModalContext();
</script>

{#if ctx.isDesktop}
	<Dialog.Portal>
		{@render children?.()}
	</Dialog.Portal>
{:else}
	<Drawer.Portal>
		{@render children?.()}
	</Drawer.Portal>
{/if}
