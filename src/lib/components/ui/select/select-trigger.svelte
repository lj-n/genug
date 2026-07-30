<script lang="ts">
	import type { WithoutChild } from 'bits-ui';

	import { hoverOutline, invalidRing } from '$lib/components/ui/focus-ring';
	import { Select as SelectPrimitive } from 'bits-ui';
	import { cn } from 'tailwind-variants';
	import PhCaretDown from '~icons/ph/caret-down';

	let {
		children,
		class: className,
		ref = $bindable(null),
		size = 'default',
		...restProps
	}: WithoutChild<SelectPrimitive.TriggerProps> & {
		size?: 'default' | 'sm';
	} = $props();
</script>

<SelectPrimitive.Trigger
	bind:ref
	data-slot="select-trigger"
	data-size={size}
	class={cn(
		invalidRing,
		"flex w-fit items-center justify-between gap-1.5 rounded-md border border-muted/20 bg-muted/5 py-2 pr-2 pl-2.5 text-sm whitespace-nowrap outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-error data-placeholder:text-muted data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		hoverOutline,
		className
	)}
	{...restProps}
>
	{@render children?.()}
	<PhCaretDown class="pointer-events-none size-4 text-muted" />
</SelectPrimitive.Trigger>
