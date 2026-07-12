<script lang="ts">
	import type { Snippet } from 'svelte';

	import * as Dialog from '$lib/components/ui/dialog';
	import * as Drawer from '$lib/components/ui/drawer';

	import { getResponsiveModalContext } from './context';

	let { children, class: className }: { children?: Snippet; class?: string } = $props();

	const ctx = getResponsiveModalContext();
</script>

{#if ctx.isDesktop}
	<Dialog.Description class={className}>
		{@render children?.()}
	</Dialog.Description>
{:else}
	<Drawer.Description class={className}>
		{@render children?.()}
	</Drawer.Description>
{/if}
