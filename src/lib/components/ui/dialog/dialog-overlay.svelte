<script lang="ts">
	import { scrimFade } from '$lib/components/ui/overlay-motion';
	import { Dialog as DialogPrimitive } from 'bits-ui';
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
					'fixed inset-0 z-50 w-screen bg-background/75 supports-backdrop-filter:backdrop-blur-xs',
					className
				)}
				transition:scrimFade
			></div>
		{/if}
	{/snippet}
</DialogPrimitive.Overlay>
