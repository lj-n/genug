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
		'flex items-center justify-end px-2 py-1 whitespace-nowrap first:justify-start last:p-0 last:py-1',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
