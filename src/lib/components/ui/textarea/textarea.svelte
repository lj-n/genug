<script lang="ts">
	import type { WithElementRef, WithoutChildren } from 'bits-ui';
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	import { cn } from 'tailwind-variants';

	let {
		class: className,
		'data-slot': dataSlot = 'textarea',
		ref = $bindable(null),
		value = $bindable(),
		...restProps
	}: WithoutChildren<WithElementRef<HTMLTextareaAttributes>> = $props();
</script>

<textarea
	bind:this={ref}
	data-slot={dataSlot}
	class={cn(
		'flex field-sizing-content min-h-16 w-full rounded-md border border-muted/30 bg-focus/5 px-3 py-1 outline-none placeholder:text-muted/90 focus-visible:bg-focus/7 focus-visible:ring-2 focus-visible:ring-focus/80 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-error',
		className
	)}
	bind:value
	{...restProps}
></textarea>
