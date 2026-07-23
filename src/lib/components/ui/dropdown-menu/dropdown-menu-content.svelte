<script lang="ts">
	import type { ComponentProps, Snippet } from 'svelte';

	import { floatingIn, floatingOut } from '$lib/components/ui/overlay-motion';
	import { DropdownMenu as DropdownMenuPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import { cn } from 'tailwind-variants';

	import DropdownMenuPortal from './dropdown-menu-portal.svelte';

	let {
		align = 'start',
		children,
		class: className,
		portalProps,
		ref = $bindable(null),
		sideOffset = 4,
		...restProps
	}: DropdownMenuPrimitive.ContentProps & {
		children?: Snippet;
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof DropdownMenuPortal>>;
	} = $props();
</script>

<DropdownMenuPortal {...portalProps}>
	<DropdownMenuPrimitive.Content
		data-slot="dropdown-menu-content"
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
							'z-50 w-(--bits-dropdown-menu-anchor-width) min-w-32 overflow-x-hidden overflow-y-auto rounded-md bg-surface-high p-1 text-foreground shadow-md ring-1 ring-foreground/10 outline-none data-closed:overflow-hidden',
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
	</DropdownMenuPrimitive.Content>
</DropdownMenuPortal>
