<script lang="ts">
	import type { Month } from '$lib/utils/month';

	import { m } from '$lib/paraglide/messages';
	import { getBudget, getMonthly } from '$lib/remote-functions/budget.remote';
	import { reorderCategories } from '$lib/remote-functions/category.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import { clamp } from '$lib/utils/clamp';
	import { asMoney, formatMoney } from '$lib/utils/money';
	import { createSortable } from '$lib/utils/sort-helper.svelte';
	import PhDotsSixVerticalBold from '~icons/ph/dots-six-vertical-bold';

	import BudgetTableCell from './budget-table-cell.svelte';
	import BudgetTableHeader from './budget-table-header.svelte';
	import CategoryAssignmentForm from './category-assignment-form.svelte';
	import TransferPopup from './transfer-popup.svelte';

	let {
		month,
		openCategoryDialog
	}: {
		month: Month | null;
		openCategoryDialog: (categoryId: string) => void;
	} = $props();

	const budgetId = getBudgetId();

	const { currency } = $derived(await getBudget(budgetId()));
	// `month` can transiently be null while navigating away from this route —
	// never send that to the server (see +page.svelte).
	const categories = $derived(
		await (month === null ? Promise.resolve([]) : getMonthly({ budgetId: budgetId(), month }))
	);

	const categorySortable = createSortable(() => categories, {
		direction: 'vertical',
		draggable: '[data-drag-item="category"]',
		group: 'category',
		handle: '[data-drag-handle="category"]',
		get sort() {
			return categories.length > 1;
		},
		sortedCallback: async (orderedIds: string[]) => {
			await reorderCategories(orderedIds);
			return new Response(null, { status: 200 });
		}
	});

	const otherCategoriesById = $derived(
		new Map(categories.map((cat) => [cat.id, categories.filter((f) => f.id !== cat.id)]))
	);

	let activeAssignmentCategoryId = $state<null | string>(null);
	let isActiveAssignment = $derived((id: string) => activeAssignmentCategoryId === id);

	const getPercentage = (target: number, current: number) => {
		return clamp((current / target) * 100, 0, 100);
	};
</script>

<div role="table">
	<div role="rowgroup">
		<div role="row" class="flex">
			<BudgetTableHeader class="w-2/5 text-lg font-bold tracking-tight text-foreground">
				{m.budget_monthly_table_header_category()}
			</BudgetTableHeader>
			<BudgetTableHeader class="w-1/5">
				{m.budget_monthly_table_header_amount()}
			</BudgetTableHeader>
			<BudgetTableHeader class="w-1/5">
				{m.budget_monthly_table_header_activity()}
			</BudgetTableHeader>
			<BudgetTableHeader class="w-1/5">
				{m.budget_monthly_table_header_remaining()}
			</BudgetTableHeader>
			<BudgetTableHeader class="w-9">
				<span class="sr-only">{m.budget_monthly_table_header_actions()}</span>
			</BudgetTableHeader>
		</div>
	</div>

	<div
		role="rowgroup"
		class="grid overflow-hidden rounded-xs border border-muted/20"
		{@attach categorySortable.attach}
	>
		<!-- The if narrows `month` for the row children; `categories` is empty when `month` is null. -->
		{#if month !== null}
			{#each categories as row (row.id)}
				<div
					data-drag-item="category"
					data-sortable-id={row.id}
					role="row"
					class="relative flex border-b border-muted/20 bg-surface last:border-b-0 hover:bg-muted/3"
				>
					<BudgetTableCell class="relative flex w-2/5 p-0">
						<button
							type="button"
							class="flex size-full cursor-pointer items-center px-2 text-left -outline-offset-2 hover:bg-surface hover:outline-2 hover:outline-interactive/60"
							onclick={() => openCategoryDialog(row.id)}
						>
							{row.name}
						</button>
						{#if row.targetBalance !== null}
							<div class="absolute bottom-0 flex w-full">
								<div
									class="h-1 bg-success/60"
									style="width: {getPercentage(row.targetBalance, row.remaining)}%"
								></div>
							</div>
						{/if}
					</BudgetTableCell>

					<BudgetTableCell class="relative w-1/5 justify-start p-0">
						<CategoryAssignmentForm
							bind:open={
								() => isActiveAssignment(row.id),
								(newOpen) => {
									if (newOpen) {
										activeAssignmentCategoryId = row.id;
									} else {
										activeAssignmentCategoryId = null;
									}
								}
							}
							category={row}
							{currency}
							{month}
						/>
					</BudgetTableCell>

					<BudgetTableCell class="w-1/5 font-currency">
						{formatMoney({ currency, money: asMoney(row.activity) })}
					</BudgetTableCell>

					<BudgetTableCell class="w-1/5 p-0">
						<TransferPopup
							{month}
							categoryName={row.name}
							rowId={row.id}
							remaining={row.remaining}
							otherCategories={otherCategoriesById.get(row.id)!}
						/>
					</BudgetTableCell>

					<BudgetTableCell class="w-9 border-0 last:p-2">
						<button
							class="flex size-9 cursor-grab items-center justify-center text-muted hover:text-interactive"
							data-drag-handle="category"
							aria-label={m.drag_handle_label()}
						>
							<PhDotsSixVerticalBold />
						</button>
					</BudgetTableCell>
				</div>
			{/each}
		{/if}
	</div>
</div>
