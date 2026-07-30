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
	bind:this={ref}
	data-slot="drawer-footer"
	class={cn(
		'mt-auto flex shrink-0 flex-col-reverse gap-2 p-4 *:w-full sm:flex-row sm:justify-end sm:*:w-auto',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
