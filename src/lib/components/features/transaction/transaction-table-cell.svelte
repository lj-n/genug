<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	import { cn } from 'tailwind-variants';

	let {
		child,
		children,
		class: className,
		...props
	}: HTMLButtonAttributes & { child?: Snippet } = $props();
</script>

<div class="p-2" role="cell">
	{#if child}
		{@render child()}
	{:else}
		<button
			class={cn(
				'flex size-full items-center justify-start border border-transparent px-2',
				className
			)}
			type="button"
			{...props}
		>
			{@render children?.()}
		</button>
	{/if}
</div>
