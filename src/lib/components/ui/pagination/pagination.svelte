<script lang="ts">
	import { Pagination as PaginationPrimitive } from 'bits-ui';
	import { cn } from 'tailwind-variants';

	let {
		class: className,
		count = 0,
		page = $bindable(1),
		perPage = 10,
		ref = $bindable(null),
		siblingCount = 1,
		...restProps
	}: PaginationPrimitive.RootProps = $props();
</script>

<PaginationPrimitive.Root
	bind:ref
	bind:page
	role="navigation"
	aria-label="pagination"
	data-slot="pagination"
	{count}
	{perPage}
	{siblingCount}
	class={cn('cn-pagination flex w-full justify-center', className)}
	{...restProps}
/>
