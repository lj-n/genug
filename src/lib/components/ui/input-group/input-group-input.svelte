<script lang="ts">
	import type { ComponentProps } from 'svelte';

	import { Input } from '$lib/components/ui/input';
	import { cn } from 'tailwind-variants';

	let {
		class: className,
		ref = $bindable(null),
		value = $bindable(),
		...props
	}: ComponentProps<typeof Input> = $props();
</script>

<Input
	bind:ref
	data-slot="input-group-control"
	variant="ghost"
	class={cn('flex-1', className)}
	bind:value
	{...props}
/>
