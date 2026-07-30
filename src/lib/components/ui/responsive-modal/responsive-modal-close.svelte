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
		/** asChild render: spread `props` onto your own close element. */
		child?: Snippet<[{ props: Record<string, unknown> }]>;
		children?: Snippet;
		class?: string;
	} = $props();

	const ctx = getResponsiveModalContext();
</script>

{#if ctx.isDesktop}
	<Dialog.Close {child} class={className}>
		{@render children?.()}
	</Dialog.Close>
{:else}
	<!-- Non-dismissible drawers swallow vaul's built-in close, so close through
	the bound open state instead. -->
	<Drawer.Close {child} class={className} onclick={ctx.dismissible ? undefined : () => ctx.close()}>
		{@render children?.()}
	</Drawer.Close>
{/if}
