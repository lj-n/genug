<script lang="ts">
	import type { Snippet } from 'svelte';

	import * as Dialog from '$lib/components/ui/dialog';
	import * as Drawer from '$lib/components/ui/drawer';
	import { cn } from 'tailwind-variants';

	import { getResponsiveModalContext } from './context';

	let {
		children,
		class: className,
		showCloseButton = true
	}: {
		children: Snippet;
		class?: string;
		/** Dialog-only close button; the Drawer variant uses its drag handle. */
		showCloseButton?: boolean;
	} = $props();

	const ctx = getResponsiveModalContext();
</script>

{#if ctx.isDesktop}
	<Dialog.Content
		class={className}
		{showCloseButton}
		interactOutsideBehavior={ctx.dismissible ? undefined : 'ignore'}
	>
		{@render children()}
	</Dialog.Content>
{:else}
	<!-- Escape parity with the Dialog variant, which stays escapable when
	non-dismissible; vaul swallows Escape entirely under dismissible={false}. -->
	<Drawer.Content
		class={cn('px-6 pb-6', className)}
		onEscapeKeydown={ctx.dismissible ? undefined : () => ctx.close()}
	>
		{@render children()}
	</Drawer.Content>
{/if}
