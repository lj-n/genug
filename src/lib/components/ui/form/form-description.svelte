<script lang="ts">
	import type { WithoutChild } from 'bits-ui';

	import * as FormPrimitive from 'formsnap';
	import { cn } from 'tailwind-variants';

	let {
		class: className,
		ref = $bindable(null),
		...restProps
	}: WithoutChild<FormPrimitive.DescriptionProps> = $props();
</script>

<FormPrimitive.Description
	bind:ref
	data-slot="form-description"
	class={cn('text-sm text-muted', className)}
	{...restProps}
/>
