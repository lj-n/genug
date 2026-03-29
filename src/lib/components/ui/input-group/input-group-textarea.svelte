<script lang="ts">
	import type { ComponentProps } from 'svelte';

	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { cn } from 'tailwind-variants';

	let {
		class: className,
		ref = $bindable(null),
		value = $bindable(),
		...props
	}: ComponentProps<typeof Textarea> = $props();
</script>

<Textarea
	bind:ref
	data-slot="input-group-control"
	class={cn(
		'flex-1 resize-none rounded-none border-0 bg-transparent py-2 ring-0 focus-visible:ring-0 aria-invalid:border-0',
		className
	)}
	bind:value
	{...props}
/>
