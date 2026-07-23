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
		buttonVariants({ size, variant: 'ghost' }),
		// Selection is ink (design language): the current page fills
		// bg-foreground; the ghost hover fill must not wash it out.
		'cn-pagination-link data-[active=true]:bg-foreground data-[active=true]:text-background data-[active=true]:hover:bg-foreground data-[active=true]:hover:text-background',
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
