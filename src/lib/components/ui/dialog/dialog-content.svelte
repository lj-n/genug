<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ComponentProps } from 'svelte';

	import { Button } from '$lib/components/ui/button/index.js';
	import { m } from '$lib/paraglide/messages';
	import { Dialog as DialogPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import { fly } from 'svelte/transition';
	import { cn } from 'tailwind-variants';
	import PhX from '~icons/ph/x';

	import DialogPortal from './dialog-portal.svelte';
	import * as Dialog from './index.js';

	let {
		children,
		class: className,
		portalProps,
		ref = $bindable(null),
		showCloseButton = true,
		...restProps
	}: WithoutChildrenOrChild<DialogPrimitive.ContentProps> & {
		children: Snippet;
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof DialogPortal>>;
		showCloseButton?: boolean;
	} = $props();
</script>

<DialogPortal {...portalProps}>
	<Dialog.Overlay />
	<DialogPrimitive.Content
		data-slot="dialog-content"
		{...restProps}
		forceMount
		onOpenAutoFocus={(e) => {
			e.preventDefault();
			document.documentElement.dataset.openAutoFocusFired = 'yes';
			setTimeout(() => ref?.focus(), 0);
		}}
	>
		{#snippet child({ open, props })}
			{#if open}
				<div
					bind:this={ref}
					{...props}
					class={cn(
						'fixed inset-0 z-50 m-auto flex h-fit max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100%-2rem)] flex-col gap-6 overflow-hidden rounded-md bg-surface p-6 text-sm ring-1 ring-foreground/10 outline-none',
						className
					)}
					transition:fly={{ duration: 150, x: 6, y: 6 }}
				>
					{@render children?.()}
					{#if showCloseButton}
						<DialogPrimitive.Close data-slot="dialog-close">
							{#snippet child({ props: closeProps })}
								<Button variant="ghost" class="absolute top-4 right-4" size="icon" {...closeProps}>
									<PhX />
									<span class="sr-only">{m.dialog_close()}</span>
								</Button>
							{/snippet}
						</DialogPrimitive.Close>
					{/if}
				</div>
			{/if}
		{/snippet}
	</DialogPrimitive.Content>
</DialogPortal>
