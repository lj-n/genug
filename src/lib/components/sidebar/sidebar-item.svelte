<script lang="ts">
	/* eslint-disable svelte/no-navigation-without-resolve */
	import type { ResolvedPathname } from '$app/types';
	import type { HTMLLiAttributes } from 'svelte/elements';

	import { cn } from 'tailwind-variants';

	import SidebarDragHandle from './sidebar-drag-handle.svelte';
	import SidebarIndicator from './sidebar-indicator.svelte';

	let {
		children,
		class: className,
		dragContainerId,
		dragDisabled = false,
		dragId,
		href,
		isActive,
		label,
		showSubIndicator = false,
		...props
	}: HTMLLiAttributes & {
		class?: string;
		dragContainerId: string;
		dragDisabled?: boolean;
		dragId: string;
		href: ResolvedPathname;
		isActive: boolean;
		label: string;
		showSubIndicator?: boolean;
	} = $props();
</script>

<li class={cn('grid', className)} data-drag-item={dragContainerId} data-drag-id={dragId} {...props}>
	<div
		class={cn(
			'group flex items-center rounded-md bg-background transition-colors hover:bg-muted/5',
			isActive && 'bg-info/10 hover:bg-info/15'
		)}
	>
		<a {href} class={cn('flex w-full items-center p-2', !showSubIndicator && 'font-medium')}>
			<SidebarIndicator {isActive} {showSubIndicator} />
			{label}
		</a>

		{#if !dragDisabled}
			<SidebarDragHandle {dragContainerId} />
		{/if}
	</div>

	{@render children?.()}
</li>
