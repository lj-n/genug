<script lang="ts">
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLThAttributes } from 'svelte/elements';

	import { cn } from 'tailwind-variants';

	let {
		children,
		class: className,
		ref = $bindable(null),
		...restProps
	}: WithElementRef<HTMLThAttributes> = $props();
</script>

<th
	bind:this={ref}
	data-slot="table-head"
	class={cn(
		'h-8 px-2 text-left align-middle text-xs tracking-wider whitespace-nowrap text-muted uppercase [&:has([role=checkbox])]:pr-0',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</th>
