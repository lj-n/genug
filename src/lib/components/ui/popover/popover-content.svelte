<script lang="ts">
	import type { ComponentProps } from 'svelte';

	import { floatingIn, floatingOut } from '$lib/components/ui/overlay-motion';
	import {
		Popover as PopoverPrimitive,
		type WithChildren,
		type WithoutChildrenOrChild
	} from 'bits-ui';
	import { cn } from 'tailwind-variants';

	import PopoverPortal from './popover-portal.svelte';

	let {
		align = 'center',
		children,
		class: className,
		portalProps,
		ref = $bindable(null),
		sideOffset = 4,
		...restProps
	}: WithChildren<PopoverPrimitive.ContentProps> & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof PopoverPortal>>;
	} = $props();
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
						in:floatingIn={{ side: props['data-side'] }}
						out:floatingOut
					>
						{@render children?.()}
					</div>
				</div>
			{/if}
		{/snippet}
	</PopoverPrimitive.Content>
</PopoverPortal>
