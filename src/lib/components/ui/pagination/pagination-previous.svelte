<script lang="ts">
	import type { ComponentProps } from 'svelte';

	import { cn } from 'tailwind-variants';
	import PhCaretLeft from '~icons/ph/caret-left';

	import { PaginationLink } from '.';

	type PaginationPreviousProps = ComponentProps<typeof PaginationLink>;

	let { class: className, ...restProps }: PaginationPreviousProps = $props();
</script>

<PaginationLink
	aria-label="Go to previous page"
	size="default"
	class={cn('pl-2!', className)}
	{...restProps}
>
	<PhCaretLeft data-icon="inline-start" />
	<span class="cn-pagination-previous-text hidden sm:block">Previous</span>
</PaginationLink>
