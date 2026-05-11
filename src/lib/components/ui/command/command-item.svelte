<script lang="ts">
	import { Command as CommandPrimitive } from 'bits-ui';
	import { cn } from 'tailwind-variants';

	let {
		children,
		class: className,
		ref = $bindable(null),
		...restProps
	}: CommandPrimitive.ItemProps = $props();
</script>

<CommandPrimitive.Item
	bind:ref
	data-slot="command-item"
	class={cn(
		"group/command-item relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none hover:bg-muted/5 in-data-[slot=dialog-content]:rounded-lg! data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-selected:bg-info/5 data-selected:text-info data-selected:hover:bg-info/8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-selected:*:[svg]:text-info",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</CommandPrimitive.Item>
