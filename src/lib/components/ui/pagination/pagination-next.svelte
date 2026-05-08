<script lang="ts">
	import type { ComponentProps } from 'svelte';

	import { cn } from 'tailwind-variants';
	import PhCaretRight from '~icons/ph/caret-right';

	import { PaginationLink } from './index.js';

	type PaginationNextProps = ComponentProps<typeof PaginationLink>;

	let { class: className, ...restProps }: PaginationNextProps = $props();
</script>

<PaginationLink
	aria-label="Go to next page"
	size="default"
	class={cn('pr-2!', className)}
	{...restProps}
>
	<span class="cn-pagination-next-text hidden sm:block">Next</span>
	<PhCaretRight data-icon="inline-end" />
</PaginationLink>
