<script lang="ts">
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLAttributes } from 'svelte/elements';

	import { cn } from 'tailwind-variants';

	let {
		children,
		class: className,
		ref = $bindable(null),
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLHeadingElement>> = $props();
</script>

<h1
	bind:this={ref}
	class={cn('flex items-center gap-2 text-3xl font-bold tracking-tighter', className)}
	{...restProps}
>
	{@render children?.()}
</h1>
