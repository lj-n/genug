<script lang="ts">
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLAttributes } from 'svelte/elements';

	import { cn } from 'tailwind-variants';

	type NotificationBadgeProps = WithElementRef<HTMLAttributes<HTMLDivElement>>;

	let {
		children,
		class: className,
		ref = $bindable(null),
		...restProps
	}: NotificationBadgeProps = $props();
</script>

<div
	bind:this={ref}
	class={cn(
		'flex items-center gap-1.5 rounded-lg border border-muted/20 bg-surface-high px-2 py-1 text-sm font-medium shadow-lg',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
