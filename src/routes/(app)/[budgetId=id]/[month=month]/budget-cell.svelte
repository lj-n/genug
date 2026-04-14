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
	role="cell"
	bind:this={ref}
	class={cn(
		'flex items-center justify-end border-r border-muted/10 p-2 whitespace-nowrap group-data-dragging/row:bg-surface-high first:justify-start last:p-0 last:py-2',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
