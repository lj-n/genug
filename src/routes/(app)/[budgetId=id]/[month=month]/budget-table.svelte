<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '$lib/paraglide/messages';
	import { clamp } from '$lib/utils/clamp';
	import { getIntlContext } from '$lib/utils/intl-context.svelte';
	import { createSortable } from '$lib/utils/sort-helper.svelte';
	import { useDialog } from '$lib/utils/use-dialog';
	import { cn } from 'tailwind-variants';
	import PhDotsSixVerticalBold from '~icons/ph/dots-six-vertical-bold';

	import type { PageData } from './$types';

	import AssignmentForm from './assignment-form.svelte';
	import Cell from './budget-cell.svelte';
	import Head from './budget-head.svelte';

	type BudgetTableRow = PageData['categories'][number];

	let {
		assignmentForm,
		categories,
		month,
		openCategoryDialog
	}: {
		assignmentForm: PageData['assignmentForm'];
		categories: BudgetTableRow[];
		month: PageData['month'];
		openCategoryDialog: (category: BudgetTableRow) => void;
	} = $props();

	const { formatCurrency } = getIntlContext();

	function saveOrder() {
		return (orderedIds: string[]) =>
			fetch('/api/reorder', {
				body: JSON.stringify({
					entity: 'category',
					orderedIds
				}),
				headers: {
					'content-type': 'application/json'
				},
				method: 'POST'
			});
	}

	const categorySortable = createSortable(() => categories, {
		direction: 'vertical',
		draggable: '[data-drag-item="category"]',
		group: 'category',
		handle: '[data-drag-handle="category"]',
		get sort() {
			return categories.length > 1;
		},
		sortedCallback: saveOrder()
	});

	let activeAssignmentCategoryId = $state<null | string>(null);
	let isActiveAssignment = $derived((id: string) => activeAssignmentCategoryId === id);
</script>

<div role="table">
	<div role="rowgroup">
		<div role="row" class="flex">
			<Head class="w-2/5">
				{m.budget_monthly_table_header_category()}
			</Head>
			<Head class="w-1/5">
				{m.budget_monthly_table_header_amount()}
			</Head>
			<Head class="w-1/5">
				{m.budget_monthly_table_header_activity()}
			</Head>
			<Head class="w-1/5">
				{m.budget_monthly_table_header_remaining()}
			</Head>
			<Head class="w-9">
				<span class="sr-only">{m.budget_monthly_table_header_actions()}</span>
			</Head>
		</div>
	</div>

	<div
		role="rowgroup"
		class="grid overflow-hidden rounded-md border border-muted/10"
		{@attach categorySortable.attach}
	>
		{#each categories as row (row.id)}
			<div
				data-drag-item="category"
				data-sortable-id={row.id}
				role="row"
				class={cn(
					'relative flex border-b border-muted/20 bg-surface last:border-b-0 hover:bg-muted/5',
					''
				)}
			>
				<Cell class="relative flex w-2/5 p-0 hover:bg-surface">
					<a
						class="flex size-full items-center px-2 -outline-offset-2 hover:bg-interactive/15 hover:outline-2 hover:outline-interactive/40"
						href={resolve('/(app)/[budgetId=id]/categories/[categoryId=id]', {
							budgetId: row.budgetId,
							categoryId: row.id
						})}
						{@attach useDialog(() => openCategoryDialog(row))}
					>
						{row.name}
					</a>
					{#if row.currentTargetPercentage !== null}
						<div class="absolute bottom-0 flex w-full">
							<div
								class="h-1 bg-success/60"
								style="width: {clamp(row.currentTargetPercentage, 0, 100)}%"
							></div>
						</div>
					{/if}
				</Cell>

				<Cell class="relative w-1/5 justify-start p-0 hover:bg-surface">
					<AssignmentForm
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
						form={assignmentForm}
						{month}
					/>
				</Cell>

				<Cell class="w-1/5 font-currency">
					{formatCurrency(row.thisMonthActivity)}
				</Cell>

				<Cell class="w-1/5 justify-end">
					<span
						class={cn(
							'w-fit rounded-full border border-muted/20 bg-muted/10 px-2 text-lg font-currency',
							row.thisMonthRemaining < 0 && 'border-error/50 bg-error/20',
							row.thisMonthRemaining > 0 && 'border-success/80 bg-success/20'
						)}
					>
						{formatCurrency(row.thisMonthRemaining)}
					</span>
				</Cell>

				<Cell class="w-9 border-0 last:p-2 ">
					<button
						class="flex size-9 cursor-grab items-center justify-center text-muted hover:text-interactive"
						data-drag-handle="category"
						aria-label="Drag Handle"
					>
						<PhDotsSixVerticalBold />
					</button>
				</Cell>
			</div>
		{/each}
	</div>
</div>
