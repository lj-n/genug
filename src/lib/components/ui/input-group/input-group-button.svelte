<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { cn } from 'tailwind-variants';

	let {
		ref = $bindable(null),
		class: className,
		children,
		type = 'button',
		variant = 'ghost',
		size = 'default',
		...restProps
	}: ComponentProps<typeof Button> = $props();
</script>

<Button bind:ref {type} {variant} {size} class={cn('', className)} {...restProps}>
	{@render children?.()}
</Button>
