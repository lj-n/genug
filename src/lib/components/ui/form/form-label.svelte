<script lang="ts">
	import * as FormPrimitive from 'formsnap';
	import { Label } from '$lib/components/ui/label/index.js';
	import type { WithoutChild } from 'bits-ui';
	import { cn } from 'tailwind-variants';

	let {
		ref = $bindable(null),
		children,
		class: className,
		...restProps
	}: WithoutChild<FormPrimitive.LabelProps> = $props();
</script>

<FormPrimitive.Label {...restProps} bind:ref>
	{#snippet child({ props })}
		<Label {...props} data-slot="form-label" class={cn('data-fs-error:text-error', className)}>
			{@render children?.()}
		</Label>
	{/snippet}
</FormPrimitive.Label>
