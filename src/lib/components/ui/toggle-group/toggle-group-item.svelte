<script lang="ts">
	import { focusRing } from '$lib/components/ui/focus-ring';
	import { ToggleGroup as ToggleGroupPrimitive, type WithoutChild } from 'bits-ui';
	import { cn } from 'tailwind-variants';

	let {
		children: childrenProp,
		class: className,
		ref = $bindable(null),
		...restProps
	}: WithoutChild<ToggleGroupPrimitive.ItemProps> = $props();
</script>

<ToggleGroupPrimitive.Item
	bind:ref
	data-slot="toggle-group-item"
	class={cn(
		focusRing,
		"inline-flex items-center justify-center gap-1.5 rounded-sm px-3 py-1 text-sm font-medium whitespace-nowrap text-muted transition-colors outline-none select-none hover:text-foreground disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-interactive/10 data-[state=on]:text-interactive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		className
	)}
	{...restProps}
>
	{#snippet children({ pressed })}
		{@render childrenProp?.({ pressed })}
	{/snippet}
</ToggleGroupPrimitive.Item>
