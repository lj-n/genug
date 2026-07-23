<script lang="ts">
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLAttributes } from 'svelte/elements';

	import { cn } from 'tailwind-variants';

	let {
		children,
		class: className,
		ref = $bindable(null),
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLElement>> = $props();
</script>

<caption
	bind:this={ref}
	data-slot="table-caption"
	class={cn('mt-2 text-sm text-muted', className)}
	{...restProps}
>
	{@render children?.()}
</caption>
