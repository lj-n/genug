<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';

	import { cn } from 'tailwind-variants';
	import PhDotsSixVertical from '~icons/ph/dots-six-vertical';

	let {
		class: className,
		dragContainerId,
		dragLabel = 'item',
		...props
	}: HTMLButtonAttributes & {
		class?: string;
		dragContainerId: string;
		dragLabel?: string;
	} = $props();
</script>

<button
	type="button"
	aria-label={`Reorder ${dragLabel}`}
	title={`Reorder ${dragLabel}`}
	class={cn(
		'ml-auto cursor-grab rounded-sm opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-info/50 focus-visible:outline-none',
		className
	)}
	data-drag-handle={dragContainerId}
	{...props}
>
	<PhDotsSixVertical class="size-6 text-interactive" />
</button>
