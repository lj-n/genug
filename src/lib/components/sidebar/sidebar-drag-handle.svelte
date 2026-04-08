<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';

	import { cn } from 'tailwind-variants';
	import PhDotsSixVertical from '~icons/ph/dots-six-vertical';

	let {
		class: className,
		dragContainerId,
		...props
	}: HTMLButtonAttributes & { class?: string; dragContainerId: string } = $props();
</script>

<button
	aria-label="Drag Handle"
	class={cn('ml-auto cursor-grab opacity-0 transition-opacity group-hover:opacity-100', className)}
	data-drag-handle={dragContainerId}
	{...props}
>
	<PhDotsSixVertical class="size-6 text-interactive" />
</button>
