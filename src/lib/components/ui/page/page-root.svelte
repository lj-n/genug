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

<!-- Extra bottom padding while the floating nav toggle is shown (below @7xl)
     so it never covers the last row of content when fully scrolled. -->
<div
	bind:this={ref}
	class={cn('flex w-full flex-col gap-4 p-4 md:p-8 @max-7xl/main:pb-24', className)}
	{...restProps}
>
	{@render children?.()}
</div>
