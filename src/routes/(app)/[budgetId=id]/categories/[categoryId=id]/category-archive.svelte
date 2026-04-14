<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import { getIntlContext } from '$lib/utils/intl-context.svelte';
	import { ParaglideMessage } from '@inlang/paraglide-js-svelte';
	import { cn } from 'tailwind-variants';
	import PhArchiveTrayBold from '~icons/ph/archive-tray-bold';
	import PhTrayArrowUpBold from '~icons/ph/tray-arrow-up-bold';

	import type { PageData } from './$types';

	import { hasNoPendingTransactions, hasNoRemainingBudget, isArchivable } from './category-utils';

	let { category }: { category: PageData['category'] } = $props();

	const { formatCurrency } = getIntlContext();

	let isArchived = $derived(category.archivedAt !== null);

	let noRemainingBudget = $derived(hasNoRemainingBudget(category));
	let noPendingTransactions = $derived(hasNoPendingTransactions(category));

	let archivable = $derived(isArchivable(category));

	let { buttonText, description, title } = $derived({
		buttonText: isArchived ? m.category_restore_button : m.category_archive_button,
		description: isArchived ? m.category_restore_info : m.category_archive_info,
		title: isArchived ? m.category_section_title_restore : m.category_section_title_archive
	});

	let action = $derived(
		isArchived
			? resolve('/(app)/[budgetId=id]/categories/[categoryId=id]?/restore', {
					budgetId: category.budgetId,
					categoryId: category.id
				})
			: resolve('/(app)/[budgetId=id]/categories/[categoryId=id]?/archive', {
					budgetId: category.budgetId,
					categoryId: category.id
				})
	);
</script>

<section
	class={cn(
		'flex flex-col gap-3',
		'@3xl:rounded-md @3xl:border @3xl:border-muted/20 @3xl:bg-background @3xl:p-3 @3xl:shadow-xs'
	)}
>
	<h2 class="text-lg font-semibold">
		{title()}
	</h2>

	<p class="text-muted">
		{description()}
	</p>

	{#if !archivable}
		<div class="flex flex-col gap-2 rounded-md bg-error/10 p-2 text-error">
			{#if !noRemainingBudget}
				<div>
					<ParaglideMessage message={m.category_not_archivable_balance} inputs={{}}>
						{#snippet sum()}
							<span class="font-semibold tabular-nums">
								{formatCurrency(
									category.totalAssignedBudgetSum + category.totalRelatedTransactionSum
								)}
							</span>
						{/snippet}

						{#snippet required()}
							<span class="font-semibold tabular-nums">
								{formatCurrency(0)}
							</span>
						{/snippet}
					</ParaglideMessage>
				</div>
			{/if}

			{#if !noPendingTransactions}
				<div>
					{m.category_not_archivable_pending_transactions()}
				</div>
			{/if}
		</div>
	{/if}

	<form method="POST" {action} class="mt-auto ml-auto" use:enhance>
		<Button type="submit" disabled={!archivable} aria-disabled={!archivable}>
			{#if isArchived}
				<PhTrayArrowUpBold class="size-4" />
			{:else}
				<PhArchiveTrayBold class="size-4" />
			{/if}

			{buttonText()}
		</Button>
	</form>
</section>
