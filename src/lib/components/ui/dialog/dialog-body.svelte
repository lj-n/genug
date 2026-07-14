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
	The scrollable middle of a modal. `min-h-0` lets it shrink below its content
	inside the flex column so the pinned header/footer stay in view and only this
	region scrolls when the content outgrows the viewport.
-->
<div
	bind:this={ref}
	data-slot="dialog-body"
	class={cn('min-h-0 flex-1 overflow-y-auto', className)}
	{...restProps}
>
	{@render children?.()}
</div>
