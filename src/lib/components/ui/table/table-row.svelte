<script lang="ts">
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLAttributes } from 'svelte/elements';

	import { cn } from 'tailwind-variants';
	let {
		children,
		class: className,
		ref = $bindable(null),
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLTableRowElement>> = $props();
</script>

<!-- Rows are slabs (design language P5): each data row is its own bordered
     surface in a gapped stack; header rows (th-only) stay chromeless. -->
<tr
	bind:this={ref}
	data-slot="table-row"
	class={cn(
		'group/table-row [&>td]:border-y [&>td]:border-muted/20 [&>td]:bg-surface [&>td:first-child]:rounded-l-xs [&>td:first-child]:border-l [&>td:last-child]:rounded-r-xs [&>td:last-child]:border-r',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</tr>
