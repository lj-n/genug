<script lang="ts">
	import type { Snippet } from 'svelte';

	import * as Dialog from '$lib/components/ui/dialog';
	import * as Drawer from '$lib/components/ui/drawer';

	import { getResponsiveModalContext } from './context';

	let { children, class: className }: { children?: Snippet; class?: string } = $props();

	const ctx = getResponsiveModalContext();
</script>

{#if ctx.isDesktop}
	<Dialog.Header class={className}>
		{@render children?.()}
	</Dialog.Header>
{:else}
	<Drawer.Header class={className}>
		{@render children?.()}
	</Drawer.Header>
{/if}
