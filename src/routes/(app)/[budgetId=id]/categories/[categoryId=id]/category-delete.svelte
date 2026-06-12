<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { m } from '$lib/paraglide/messages';
	import { getCategoryById } from '$lib/remote-functions/category.remote';
	import { ParaglideMessage } from '@inlang/paraglide-js-svelte';
	import { cn } from 'tailwind-variants';
	import PhWarningBold from '~icons/ph/warning-bold';

	let { categoryId }: { categoryId: string } = $props();

	const category = $derived(await getCategoryById({ categoryId }));
</script>

<section
	class={cn(
		'flex flex-col gap-3',
		'@3xl:rounded-md @3xl:border @3xl:border-muted/20 @3xl:bg-background @3xl:p-3 @3xl:shadow-xs'
	)}
>
	<h2 class="flex items-center gap-2 text-lg font-semibold text-error">
		<PhWarningBold />
		{m.category_section_title_delete()}
	</h2>

	<p class="rounded-md bg-error/10 p-2 text-error">
		<ParaglideMessage
			message={m.category_delete_info}
			inputs={{
				assignments: category.totalAssignedBudgetCount,
				transactions: category.totalRelatedTransactionCount
			}}
		>
			{#snippet b({ children })}
				<b>{@render children?.()}</b>
			{/snippet}
		</ParaglideMessage>
	</p>

	<Button variant="destructive" class="mt-auto ml-auto">
		{m.category_delete_button()}
	</Button>
</section>
