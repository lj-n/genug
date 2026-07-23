<script lang="ts">
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLTdAttributes } from 'svelte/elements';

	import { cn } from 'tailwind-variants';

	let {
		children,
		class: className,
		ref = $bindable(null),
		...restProps
	}: WithElementRef<HTMLTdAttributes> = $props();
</script>

<td
	bind:this={ref}
	data-slot="table-cell"
	class={cn('px-2 py-1 align-middle whitespace-nowrap', className)}
	{...restProps}
>
	{@render children?.()}
</td>
