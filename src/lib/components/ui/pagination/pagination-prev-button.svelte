<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import { Pagination as PaginationPrimitive } from 'bits-ui';
	import { cn } from 'tailwind-variants';
	import PhCaretLeft from '~icons/ph/caret-left';

	let {
		children,
		class: className,
		ref = $bindable(null),
		...restProps
	}: PaginationPrimitive.PrevButtonProps = $props();
</script>

{#snippet Fallback()}
	<PhCaretLeft class={cn('size-4', className)} />
	<span>{m.pagination_previous()}</span>
{/snippet}

<PaginationPrimitive.PrevButton
	bind:ref
	aria-label="Go to previous page"
	class={cn(buttonVariants({ size: 'sm', variant: 'ghost' }), 'pl-2! text-sm', className)}
	{...restProps}
>
	{#if children}
		{@render children?.()}
	{:else}
		{@render Fallback()}
	{/if}
</PaginationPrimitive.PrevButton>
