<script lang="ts">
	import type { ComponentProps, Snippet } from 'svelte';

	import { floatingIn, floatingOut } from '$lib/components/ui/overlay-motion';
	import { Select as SelectPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import { cn } from 'tailwind-variants';

	import SelectPortal from './select-portal.svelte';
	import SelectScrollDownButton from './select-scroll-down-button.svelte';
	import SelectScrollUpButton from './select-scroll-up-button.svelte';

	let {
		children,
		class: className,
		portalProps,
		preventScroll = true,
		ref = $bindable(null),
		sideOffset = 4,
		...restProps
	}: WithoutChildrenOrChild<SelectPrimitive.ContentProps> & {
		children?: Snippet;
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof SelectPortal>>;
	} = $props();
</script>

<SelectPortal {...portalProps}>
	<SelectPrimitive.Content
		{sideOffset}
		{preventScroll}
		data-slot="select-content"
		forceMount
		{...restProps}
	>
		{#snippet child({ open, props, wrapperProps })}
			{#if open}
				<div {...wrapperProps}>
					<div
						bind:this={ref}
						{...props}
						class={cn(
							'relative isolate z-50 min-w-36 overflow-x-hidden overflow-y-auto rounded-md bg-surface-high shadow-md ring-1 ring-muted/20',
							className
						)}
						in:floatingIn={{ side: props['data-side'] }}
						out:floatingOut
					>
						<SelectScrollUpButton />
						<SelectPrimitive.Viewport
							class={cn(
								'h-(--bits-select-anchor-height) w-full min-w-(--bits-select-anchor-width) scroll-my-1'
							)}
						>
							{@render children?.()}
						</SelectPrimitive.Viewport>
						<SelectScrollDownButton />
					</div>
				</div>
			{/if}
		{/snippet}
	</SelectPrimitive.Content>
</SelectPortal>
