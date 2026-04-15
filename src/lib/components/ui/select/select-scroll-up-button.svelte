<script lang="ts">
	import type { WithoutChildrenOrChild } from 'bits-ui';

	import { Select as SelectPrimitive } from 'bits-ui';
	import { cn } from 'tailwind-variants';
	import PhCaretUp from '~icons/ph/caret-up';

	let {
		class: className,
		ref = $bindable(null),
		...restProps
	}: WithoutChildrenOrChild<SelectPrimitive.ScrollUpButtonProps> = $props();
</script>

<SelectPrimitive.ScrollUpButton
	bind:ref
	data-slot="select-scroll-up-button"
	class={cn(
		"top-0 z-10 flex w-full cursor-default items-center justify-center bg-surface py-1 [&_svg:not([class*='size-'])]:size-4",
		className
	)}
	{...restProps}
>
	<PhCaretUp />
</SelectPrimitive.ScrollUpButton>
