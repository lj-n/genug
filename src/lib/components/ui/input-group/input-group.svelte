<script lang="ts">
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLAttributes } from 'svelte/elements';

	import { cn } from 'tailwind-variants';

	import { focusRingWithin, hoverOutline } from '../focus-ring';

	let {
		children,
		class: className,
		ref = $bindable(null),
		...props
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	bind:this={ref}
	data-slot="input-group"
	role="group"
	class={cn(
		`group/input-group relative flex w-full min-w-0 items-center rounded-md border border-muted/20 bg-muted/5 outline-none in-data-[slot=combobox-content]:focus-within:border-inherit in-data-[slot=combobox-content]:focus-within:ring-0 ${hoverOutline} ${focusRingWithin} has-[[data-slot][aria-invalid=true]]:border-error has-[[data-slot][aria-invalid=true]]:not-has-[:is(input,select,textarea):focus-visible]:ring-3 has-[[data-slot][aria-invalid=true]]:not-has-[:is(input,select,textarea):focus-visible]:ring-error/20 has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>textarea]:h-auto has-[>[data-align=block-end]]:[&>input]:pt-3 has-[>[data-align=block-start]]:[&>input]:pb-3 has-[>[data-align=inline-end]]:[&>input]:pr-1.5 has-[>[data-align=inline-start]]:[&>input]:pl-1.5`,
		className
	)}
	{...props}
>
	{@render children?.()}
</div>
