<script lang="ts">
	import type { Separator as SeparatorPrimitive } from 'bits-ui';

	import { Separator } from '$lib/components/ui/separator';
	import { cn } from 'tailwind-variants';

	let {
		class: className,
		ref = $bindable(null),
		...restProps
	}: SeparatorPrimitive.RootProps = $props();
</script>

<Separator
	bind:ref
	data-slot="select-separator"
	class={cn('pointer-events-none -mx-1 my-1 h-px bg-muted/20', className)}
	{...restProps}
/>
