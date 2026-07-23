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
	region scrolls when the content outgrows the viewport. Must not be `flex-1`:
	WebKit resolves a flex-basis of 0 to zero intrinsic height under the
	content's `h-fit`, collapsing the body entirely in Safari. `-m-1 p-1` keeps
	the layout identical but moves the overflow clip edge 4px out, so focus
	rings and error halos on edge-flush fields aren't cut off.
-->
<div
	bind:this={ref}
	data-slot="dialog-body"
	class={cn('-m-1 min-h-0 shrink overflow-y-auto p-1', className)}
	{...restProps}
>
	{@render children?.()}
</div>
