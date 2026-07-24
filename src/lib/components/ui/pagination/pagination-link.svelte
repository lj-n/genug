<script lang="ts">
	import { type ButtonSize, buttonVariants } from '$lib/components/ui/button';
	import { Pagination as PaginationPrimitive } from 'bits-ui';
	import { cn } from 'tailwind-variants';
	let {
		children,
		class: className,
		isActive,
		page,
		ref = $bindable(null),
		size = 'icon-sm',
		...restProps
	}: PaginationPrimitive.PageProps & {
		isActive: boolean;
		size?: ButtonSize;
	} = $props();
</script>

{#snippet Fallback()}
	{page.value}
{/snippet}

<PaginationPrimitive.Page
	bind:ref
	{page}
	aria-current={isActive ? 'page' : undefined}
	data-slot="pagination-link"
	data-active={isActive}
	data-size={size}
	class={cn(
		// The current page wears the interactive tint (amends the #259
		// selection-is-ink lock for pagination); other pages stay ghosts.
		buttonVariants({ size, variant: isActive ? 'default' : 'ghost' }),
		'cn-pagination-link',
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children?.()}
	{:else}
		{@render Fallback()}
	{/if}
</PaginationPrimitive.Page>
