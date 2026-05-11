<script lang="ts">
	import { Command as CommandPrimitive } from 'bits-ui';
	import { cn } from 'tailwind-variants';

	let {
		class: className,
		ref = $bindable(null),
		...restProps
	}: CommandPrimitive.SeparatorProps = $props();
</script>

<CommandPrimitive.Separator
	bind:ref
	data-slot="command-separator"
	class={cn('-mx-1 h-px w-auto bg-muted/20', className)}
	{...restProps}
/>
