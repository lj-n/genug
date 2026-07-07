<script lang="ts">
	import type { WithElementRef, WithoutChildren } from 'bits-ui';
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	import { inputVariants } from '$lib/components/ui/input';
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
		inputVariants({ multiline: true }),
		'flex disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
	bind:value
	{...restProps}
></textarea>
