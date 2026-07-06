<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '$lib/paraglide/messages';
	import { getBudget, getMonthly } from '$lib/remote-functions/budget.remote';
	import { reorderCategories } from '$lib/remote-functions/category.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import { clamp } from '$lib/utils/clamp';
	import { formatCurrency } from '$lib/utils/format-currency';
	import { createSortable } from '$lib/utils/sort-helper.svelte';
	import { useDialog } from '$lib/utils/use-dialog';
	import { untrack } from 'svelte';
	import { cn } from 'tailwind-variants';
	import PhDotsSixVerticalBold from '~icons/ph/dots-six-vertical-bold';

	import BudgetTableCell from './budget-table-cell.svelte';
	import BudgetTableHeader from './budget-table-header.svelte';
	import CategoryAssignmentForm from './category-assignment-form.svelte';
	import TransferPopup from './transfer-popup.svelte';

	let {
		month,
		openCategoryDialog
	}: {
		month: string;
		openCategoryDialog: (categoryId: string) => void;
	} = $props();

	const budgetId = getBudgetId();

	const { currency } = $derived(await getBudget(budgetId()));
	const monthNum = parseInt(untrack(() => month));
	const categories = $derived(
		await getMonthly({
			budgetId: budgetId(),
			month: Number.isNaN(monthNum) ? 0 : monthNum
		})
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
		{#each categories as row (row.id)}
			<div
				data-drag-item="category"
				data-sortable-id={row.id}
				role="row"
				class={cn(
					'relative flex border-b border-muted/20 bg-surface last:border-b-0 hover:bg-muted/3',
					''
				)}
			>
				<BudgetTableCell class="relative flex w-2/5 p-0 hover:bg-surface">
					<a
						class="flex size-full items-center px-2 -outline-offset-2 hover:bg-interactive/15 hover:outline-2 hover:outline-interactive/40"
						href={resolve('/(app)/[budgetId=id]/categories/[categoryId=id]', {
							budgetId: budgetId(),
							categoryId: row.id
						})}
						{@attach useDialog(() => openCategoryDialog(row.id))}
					>
						{row.name}
					</a>
					{#if row.targetBalance !== null}
						<div class="absolute bottom-0 flex w-full">
							<div
								class="h-1 bg-success/60"
								style="width: {getPercentage(row.targetBalance, row.remaining)}%"
							></div>
						</div>
					{/if}
				</BudgetTableCell>

				<BudgetTableCell class="relative w-1/5 justify-start p-0 hover:bg-surface">
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
						{month}
					/>
				</BudgetTableCell>

				<BudgetTableCell class="w-1/5 font-currency">
					{formatCurrency({ centValue: row.activity, currency })}
				</BudgetTableCell>

				<BudgetTableCell class="w-1/5 p-0">
					<TransferPopup
						{month}
						rowId={row.id}
						remaining={row.remaining}
						otherCategories={categories.filter((f) => f.id !== row.id)}
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
	</div>
</div>
