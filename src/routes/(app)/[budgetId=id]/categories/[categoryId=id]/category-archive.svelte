<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import { getBudget } from '$lib/remote-functions/budget.remote';
	import {
		archiveCategory,
		getCategoryArchivability,
		getCategoryById,
		restoreCategory
	} from '$lib/remote-functions/category.remote';
	import { formatCurrency } from '$lib/utils/format-currency';
	import { ParaglideMessage } from '@inlang/paraglide-js-svelte';
	import { cn } from 'tailwind-variants';
	import PhArchiveTrayBold from '~icons/ph/archive-tray-bold';
	import PhTrayArrowUpBold from '~icons/ph/tray-arrow-up-bold';

	let { categoryId }: { categoryId: string } = $props();

	const category = $derived(await getCategoryById({ categoryId }));
	const archivability = $derived(await getCategoryArchivability({ categoryId }));
	const budget = $derived(await getBudget(category.budgetId));
	const currency = $derived(budget.currency);

	let isArchived = $derived(category.archivedAt !== null);
	let noRemainingBudget = $derived(archivability.remainingBalance === 0);
	let noPendingTransactions = $derived(archivability.pendingTransactionCount === 0);
	let archivable = $derived(archivability.archivable);

	let { buttonText, description, title } = $derived({
		buttonText: isArchived ? m.category_restore_button : m.category_archive_button,
		description: isArchived ? m.category_restore_info : m.category_archive_info,
		title: isArchived ? m.category_section_title_restore : m.category_section_title_archive
	});
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
								{formatCurrency({
									centValue: archivability.remainingBalance,
									currency
								})}
							</span>
						{/snippet}

						{#snippet required()}
							<span class="font-semibold tabular-nums">
								{formatCurrency({ centValue: 0, currency })}
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

	{#if isArchived}
		<form {...restoreCategory} class="mt-auto ml-auto">
			<input {...restoreCategory.fields.categoryId.as('hidden', categoryId)} />
			<Button type="submit">
				<PhTrayArrowUpBold class="size-4" />
				{buttonText()}
			</Button>
		</form>
	{:else}
		<form {...archiveCategory} class="mt-auto ml-auto">
			<input {...archiveCategory.fields.categoryId.as('hidden', categoryId)} />
			<Button type="submit" disabled={!archivable} aria-disabled={!archivable}>
				<PhArchiveTrayBold class="size-4" />
				{buttonText()}
			</Button>
		</form>
	{/if}
</section>
