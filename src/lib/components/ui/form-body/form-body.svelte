<script lang="ts">
	import type { HTMLFormAttributes } from 'svelte/elements';

	import { cn } from 'tailwind-variants';

	let { children, class: className, ...props }: HTMLFormAttributes = $props();
</script>

<form class={cn('grid space-y-3 rounded-xl bg-muted/5 p-3', className)} {...props}>
	{@render children?.()}
</form>
