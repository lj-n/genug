<script lang="ts">
	import type { WithoutChild } from 'bits-ui';

	import * as FormPrimitive from 'formsnap';
	import { cn } from 'tailwind-variants';

	let {
		class: className,
		ref = $bindable(null),
		...restProps
	}: WithoutChild<FormPrimitive.LegendProps> = $props();
</script>

<FormPrimitive.Legend
	bind:ref
	class={cn('text-sm leading-none font-medium data-fs-error:text-error', className)}
	{...restProps}
/>
