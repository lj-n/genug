<script lang="ts">
	import type { Snippet } from 'svelte';

	import { floatingIn, floatingOut } from '$lib/components/ui/overlay-motion';
	import { DropdownMenu as DropdownMenuPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
	import { cn } from 'tailwind-variants';

	let {
		children,
		class: className,
		ref = $bindable(null),
		...restProps
	}: WithoutChildrenOrChild<DropdownMenuPrimitive.SubContentProps> & {
		children?: Snippet;
	} = $props();
</script>

<DropdownMenuPrimitive.SubContent data-slot="dropdown-menu-sub-content" forceMount {...restProps}>
	{#snippet child({ open, props, wrapperProps })}
		{#if open}
			<div {...wrapperProps}>
				<div
					bind:this={ref}
					{...props}
					class={cn(
						'w-auto min-w-24 rounded-md bg-surface-high p-1 text-foreground shadow-md ring-1 ring-foreground/10',
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
</DropdownMenuPrimitive.SubContent>
