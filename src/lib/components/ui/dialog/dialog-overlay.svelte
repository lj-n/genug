<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { fade } from 'svelte/transition';
	import { cn } from 'tailwind-variants';

	let {
		class: className,
		ref = $bindable(null),
		...restProps
	}: DialogPrimitive.OverlayProps = $props();
</script>

<DialogPrimitive.Overlay data-slot="dialog-overlay" {...restProps} forceMount>
	{#snippet child({ open, props })}
		{#if open}
			<div
				bind:this={ref}
				{...props}
				class={cn(
					'fixed inset-0 z-50 w-screen bg-black/10 supports-backdrop-filter:backdrop-blur-xs',
					className
				)}
				transition:fade={{ duration: 150 }}
			></div>
		{/if}
	{/snippet}
</DialogPrimitive.Overlay>
