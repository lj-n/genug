<script lang="ts">
	import type { WithElementRef, WithoutChildren } from 'bits-ui';
	import type { HTMLTextareaAttributes } from 'svelte/elements';
	import { cn } from 'tailwind-variants';

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		'data-slot': dataSlot = 'textarea',
		...restProps
	}: WithoutChildren<WithElementRef<HTMLTextareaAttributes>> = $props();
</script>

<textarea
	bind:this={ref}
	data-slot={dataSlot}
	class={cn(
		'flex field-sizing-content min-h-16 w-full rounded-md border border-muted/30 bg-surface px-3 py-1 outline-none placeholder:text-muted/90 focus-visible:ring-2 focus-visible:ring-focus/80 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-error',
		className
	)}
	bind:value
	{...restProps}
></textarea>
