<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
	import { cn } from 'tailwind-variants';
	import PhCaretRight from '~icons/ph/caret-right';

	let {
		children,
		class: className,
		inset,
		ref = $bindable(null),
		...restProps
	}: DropdownMenuPrimitive.SubTriggerProps & {
		inset?: boolean;
	} = $props();
</script>

<DropdownMenuPrimitive.SubTrigger
	bind:ref
	data-slot="dropdown-menu-sub-trigger"
	data-inset={inset}
	class={cn(
		"flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none focus:bg-muted/10 data-inset:pl-8 data-open:bg-muted/10 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		className
	)}
	{...restProps}
>
	{@render children?.()}
	<PhCaretRight class="ml-auto" />
</DropdownMenuPrimitive.SubTrigger>
