<script lang="ts">
	import type { ComponentProps } from 'svelte';

	import { Separator } from '$lib/components/ui/separator';
	import { cn } from 'tailwind-variants';

	let {
		class: className,
		orientation = 'vertical',
		ref = $bindable(null),
		...restProps
	}: ComponentProps<typeof Separator> = $props();
</script>

<Separator
	bind:ref
	data-slot="button-group-separator"
	{orientation}
	class={cn(
		'relative self-stretch bg-background data-[orientation=horizontal]:mx-px data-[orientation=horizontal]:w-auto data-[orientation=vertical]:my-px data-[orientation=vertical]:h-auto',
		className
	)}
	{...restProps}
/>
