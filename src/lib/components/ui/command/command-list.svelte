<script lang="ts">
	import { Command as CommandPrimitive } from 'bits-ui';
	import { cn } from 'tailwind-variants';

	let {
		class: className,
		ref = $bindable(null),
		...restProps
	}: CommandPrimitive.ListProps = $props();
</script>

<CommandPrimitive.List
	bind:ref
	data-slot="command-list"
	class={cn(
		'no-scrollbar max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto outline-none',
		className
	)}
	{...restProps}
/>
