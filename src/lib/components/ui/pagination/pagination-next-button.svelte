<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import { Pagination as PaginationPrimitive } from 'bits-ui';
	import { cn } from 'tailwind-variants';
	import PhCaretRight from '~icons/ph/caret-right';

	let {
		children,
		class: className,
		ref = $bindable(null),
		...restProps
	}: PaginationPrimitive.NextButtonProps = $props();
</script>

{#snippet Fallback()}
	<span>Next</span>
	<PhCaretRight class={cn('size-4', className)} />
{/snippet}

<PaginationPrimitive.NextButton
	bind:ref
	aria-label="Go to next page"
	class={cn(buttonVariants({ size: 'sm', variant: 'ghost' }), 'pr-2! text-sm', className)}
	{...restProps}
>
	{#if children}
		{@render children?.()}
	{:else}
		{@render Fallback()}
	{/if}
</PaginationPrimitive.NextButton>
