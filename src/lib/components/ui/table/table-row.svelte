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

<!-- Zebra open ledger (design language P5): transparent rows, even stripe.
     Header/footer rows are unaffected (single odd child of their rowgroup). -->
<tr
	bind:this={ref}
	data-slot="table-row"
	class={cn('group/table-row even:bg-muted/3 hover:bg-muted/5', className)}
	{...restProps}
>
	{@render children?.()}
</tr>
