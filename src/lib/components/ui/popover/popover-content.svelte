<script lang="ts">
	import type { ComponentProps } from 'svelte';

	import { floatingIn, floatingOut } from '$lib/components/ui/overlay-motion';
	import {
		Popover as PopoverPrimitive,
		type WithChildren,
		type WithoutChildrenOrChild
	} from 'bits-ui';
	import { fade, type TransitionConfig } from 'svelte/transition';
	import { cn } from 'tailwind-variants';

	import PopoverPortal from './popover-portal.svelte';

	let {
		align = 'center',
		children,
		class: className,
		motion = 'slingshot',
		portalProps,
		ref = $bindable(null),
		sideOffset = 4,
		...restProps
	}: {
		/** `fade` opts out of the slingshot slide — for panels that overlay their anchor. */
		motion?: 'fade' | 'slingshot';
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof PopoverPortal>>;
	} & WithChildren<PopoverPrimitive.ContentProps> = $props();

	// `motion` is read at play time (closure) so it stays live if toggled.
	function enter(node: Element, params: { side?: unknown }): TransitionConfig {
		return motion === 'fade' ? fade(node, { duration: 100 }) : floatingIn(node, params);
	}
	function exit(node: Element): TransitionConfig {
		return motion === 'fade' ? fade(node, { duration: 100 }) : floatingOut(node);
	}
</script>

<PopoverPortal {...portalProps}>
	<PopoverPrimitive.Content
		data-slot="popover-content"
		forceMount
		{sideOffset}
		{align}
		{...restProps}
	>
		{#snippet child({ open, props, wrapperProps })}
			{#if open}
				<div {...wrapperProps}>
					<div
						bind:this={ref}
						{...props}
						class={cn(
							'z-50 flex w-72 origin-(--transform-origin) flex-col gap-4 rounded-md bg-surface-high p-4 text-sm shadow-md ring-1 ring-foreground/10 outline-hidden',
							className
						)}
						in:enter={{ side: props['data-side'] }}
						out:exit
					>
						{@render children?.()}
					</div>
				</div>
			{/if}
		{/snippet}
	</PopoverPrimitive.Content>
</PopoverPortal>
