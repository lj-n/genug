<script lang="ts">
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLAttributes } from 'svelte/elements';

	import { cn } from 'tailwind-variants';

	let {
		children,
		class: className,
		ref = $bindable(null),
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLHeadElement>> = $props();
</script>

<header bind:this={ref} class={cn('flex flex-col gap-2', className)} {...restProps}>
	{@render children?.()}
</header>
