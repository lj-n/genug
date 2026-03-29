<script lang="ts">
	import type { ComponentProps } from 'svelte';

	import { Button } from '$lib/components/ui/button';
	import { cn } from 'tailwind-variants';

	let {
		children,
		class: className,
		ref = $bindable(null),
		size = 'default',
		type = 'button',
		variant = 'ghost',
		...restProps
	}: ComponentProps<typeof Button> = $props();
</script>

<Button bind:ref {type} {variant} {size} class={cn('', className)} {...restProps}>
	{@render children?.()}
</Button>
