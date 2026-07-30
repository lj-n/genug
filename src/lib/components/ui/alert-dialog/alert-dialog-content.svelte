<script lang="ts">
	import type { ComponentProps, Snippet } from 'svelte';

	import { modalIn, modalOut } from '$lib/components/ui/overlay-motion';
	import { AlertDialog as AlertDialogPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import { cn } from 'tailwind-variants';

	import AlertDialogOverlay from './alert-dialog-overlay.svelte';
	import AlertDialogPortal from './alert-dialog-portal.svelte';

	let {
		children,
		class: className,
		portalProps,
		ref = $bindable(null),
		size = 'default',
		...restProps
	}: WithoutChildrenOrChild<AlertDialogPrimitive.ContentProps> & {
		children?: Snippet;
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof AlertDialogPortal>>;
		size?: 'default' | 'sm';
	} = $props();
</script>

<AlertDialogPortal {...portalProps}>
	<AlertDialogOverlay />
	<AlertDialogPrimitive.Content data-slot="alert-dialog-content" {...restProps} forceMount>
		{#snippet child({ open, props })}
			{#if open}
				<div
					bind:this={ref}
					{...props}
					data-size={size}
					class={cn(
						'group/alert-dialog-content fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-full -translate-x-1/2 -translate-y-1/2 gap-6 overflow-y-auto rounded-xl bg-surface-high p-6 text-foreground shadow-md ring-1 ring-foreground/10 outline-none data-[size=default]:max-w-xs data-[size=sm]:max-w-xs data-[size=default]:sm:max-w-lg',
						className
					)}
					in:modalIn
					out:modalOut
				>
					{@render children?.()}
				</div>
			{/if}
		{/snippet}
	</AlertDialogPrimitive.Content>
</AlertDialogPortal>
