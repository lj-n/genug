<script lang="ts">
	import type { Snippet } from 'svelte';

	import { cn } from 'tailwind-variants';

	import { colsClass } from './transaction-table-cols';

	let { children, class: className }: { children?: Snippet; class?: string } = $props();
</script>

<div
	role="row"
	class={cn(colsClass, 'grid rounded-sm border border-muted/10 bg-surface', className)}
>
	{@render children?.()}
</div>
