<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import { Input } from '$lib/components/ui/input';
	import { cn } from 'tailwind-variants';

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		...props
	}: ComponentProps<typeof Input> = $props();
</script>

<Input
	bind:ref
	data-slot="input-group-control"
	class={cn(
		'flex-1 rounded-none border-0 bg-transparent ring-0 focus-visible:ring-0 aria-invalid:border-0',
		className
	)}
	bind:value
	{...props}
/>
