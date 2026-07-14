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

<!--
	The scrollable middle of the drawer. `min-h-0` lets it shrink below its
	content inside the flex column so the drag handle and any header/footer stay
	in view and only this region scrolls past the drawer's max height.
-->
<div
	bind:this={ref}
	data-slot="drawer-body"
	class={cn('min-h-0 flex-1 overflow-y-auto', className)}
	{...restProps}
>
	{@render children?.()}
</div>
