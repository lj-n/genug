<script lang="ts">
	import type { Snippet } from 'svelte';

	import * as Dialog from '$lib/components/ui/dialog';
	import * as Drawer from '$lib/components/ui/drawer';

	import { getResponsiveModalContext } from './context';

	let {
		child,
		children,
		class: className
	}: {
		/** asChild render: spread `props` onto your own trigger element. */
		child?: Snippet<[{ props: Record<string, unknown> }]>;
		children?: Snippet;
		class?: string;
	} = $props();

	const ctx = getResponsiveModalContext();
</script>

{#if ctx.isDesktop}
	<Dialog.Trigger {child} class={className}>
		{@render children?.()}
	</Dialog.Trigger>
{:else}
	<Drawer.Trigger {child} class={className}>
		{@render children?.()}
	</Drawer.Trigger>
{/if}
