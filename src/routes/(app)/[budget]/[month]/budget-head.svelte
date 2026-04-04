<script lang="ts">
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLAttributes } from 'svelte/elements';

	import { cn } from 'tailwind-variants';

	let {
		children,
		class: className,
		ref = $bindable(null),
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	role="columnheader"
	bind:this={ref}
	class={cn(
		'flex h-10 items-center justify-end px-2 whitespace-nowrap text-muted first:justify-start',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
