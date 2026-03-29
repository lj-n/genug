<script lang="ts">
	import type { WithoutChild } from 'bits-ui';

	import { Label } from '$lib/components/ui/label/index.js';
	import * as FormPrimitive from 'formsnap';
	import { cn } from 'tailwind-variants';

	let {
		children,
		class: className,
		ref = $bindable(null),
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
