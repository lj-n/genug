<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '$lib/paraglide/messages';
	import { clamp } from '$lib/utils/clamp';
	import { formatCentToFloatString } from '$lib/utils/formatCentToFloatString';
	import { getIntlContext } from '$lib/utils/intl-context.svelte';
	import { useDialog } from '$lib/utils/use-dialog';
	import { formatValue } from '@canutin/svelte-currency-input';
	import { defaultPreset } from '@dnd-kit/dom';
	import { RestrictToElement } from '@dnd-kit/dom/modifiers';
	import { DragDropProvider } from '@dnd-kit/svelte';
	import { createSortable, isSortable } from '@dnd-kit/svelte/sortable';
	import { cn } from 'tailwind-variants';
	import PhDotsSixVerticalBold from '~icons/ph/dots-six-vertical-bold';

	import type { PageData } from './$types';

	import Cell from './budget-cell.svelte';
	import Head from './budget-head.svelte';

	type BudgetTableRow = PageData['categories'][number];

	let {
		categories,
		openCategoryDialog
	}: {
		categories: BudgetTableRow[];
		openCategoryDialog: (category: BudgetTableRow) => void;
	} = $props();

	const { locale, numberFormatOptions } = getIntlContext();

	let formatCurrency = $derived((value: number) =>
		formatValue({
			intlConfig: { locale, ...numberFormatOptions },
			value: formatCentToFloatString(value)
		})
	);

	let dragContainer: HTMLDivElement;

	async function saveCategoryOrder({
		nextCategories,
		previousCategories
	}: {
		nextCategories: BudgetTableRow[];
		previousCategories: BudgetTableRow[];
	}) {
		try {
			const response = await fetch('/api/reorder', {
				body: JSON.stringify({
					entity: 'category',
					orderedIds: nextCategories.map((category) => category.id)
				}),
				headers: {
					'content-type': 'application/json'
				},
				method: 'POST'
			});

			if (response.ok) return;

			categories = previousCategories;
		} catch {
			categories = previousCategories;
		}
	}
</script>

<div role="table" class="@container">
	<div role="rowgroup">
		<div role="row" class="flex @max-2xl:sr-only">
			<Head class="w-2/5 @max-4xl:w-3/5">
				{m.budget_monthly_table_header_category()}
			</Head>
			<Head class="w-1/5">
				{m.budget_monthly_table_header_amount()}
			</Head>
			<Head class="w-1/5 @max-4xl:hidden">
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

	<DragDropProvider
		plugins={defaultPreset.plugins}
		modifiers={[
			RestrictToElement.configure({
				get element() {
					return dragContainer;
				}
			})
		]}
		onDragEnd={(event) => {
			if (event.canceled) return;

			const { source } = event.operation;

			if (isSortable(source)) {
				const { index, initialIndex } = source;

				const previousCategories = categories;
				const tempItems = [...categories];
				const [movedItem] = tempItems.splice(initialIndex, 1);
				tempItems.splice(index, 0, movedItem);
				categories = tempItems;

				void saveCategoryOrder({
					nextCategories: tempItems,
					previousCategories
				});
			}
		}}
	>
		<div
			role="rowgroup"
			bind:this={dragContainer}
			class="rounded-md border border-muted/10 @max-2xl:grid @max-2xl:gap-2 @max-2xl:border-0 @2xl:overflow-hidden"
		>
			{#each categories as row, index (row.id)}
				{@const sortable = createSortable({
					get id() {
						return row.id;
					},
					get index() {
						return index;
					}
				})}
				<div
					role="row"
					class={cn(
						'group/row relative flex border-b border-muted/20 bg-surface last:border-b-0 hover:bg-muted/5',
						'@max-2xl:grid @max-2xl:grid-cols-2 @max-2xl:gap-y-6 @max-2xl:rounded-md @max-2xl:border @max-2xl:p-2 @max-2xl:last:border',
						sortable.isDragging && 'border-b-0 shadow-lg ring-3 ring-interactive/50'
					)}
					data-dragging={sortable.isDragging ? 'true' : undefined}
					{@attach sortable.attach}
				>
					<Cell
						class={cn(
							'w-2/5 flex-col items-start @max-4xl:w-3/5',
							'@max-2xl:order-1 @max-2xl:w-full  @max-2xl:border-0 @max-2xl:text-lg @max-2xl:font-medium',
							row.currentTargetPercentage !== null && 'p-0'
						)}
					>
						<div class={cn('my-auto', row.currentTargetPercentage !== null && 'ml-2')}>
							<a
								href={resolve('/(app)/[budget]/categories/[categoryId]', {
									budget: row.budgetId,
									categoryId: row.id
								})}
								{@attach useDialog(() => openCategoryDialog(row))}
							>
								{row.name}
							</a>
						</div>
						{#if row.currentTargetPercentage !== null}
							<div class="flex w-full @max-2xl:absolute @max-2xl:inset-0 @max-2xl:items-start">
								<div
									class="h-1 bg-success/60"
									style="width: {clamp(row.currentTargetPercentage, 0, 100)}%"
								></div>
							</div>
						{/if}
					</Cell>

					<Cell
						class="w-1/5 @max-2xl:order-3 @max-2xl:w-full @max-2xl:justify-start @max-2xl:border-0"
					>
						<div class="flex flex-col items-start gap-1">
							<span class="font-currency @max-2xl:text-lg">
								{formatCurrency(row.thisMonthAmount)}
							</span>
							<span class="text-sm font-semibold text-muted @2xl:hidden">
								{m.budget_monthly_table_header_amount()}
							</span>
						</div>
					</Cell>

					<Cell class="w-1/5 @max-4xl:hidden @max-2xl:border-0">
						{formatCurrency(row.thisMonthActivity)}
					</Cell>

					<Cell
						class="w-1/5 @max-2xl:order-4 @max-2xl:w-full @max-2xl:justify-end @max-2xl:border-0"
					>
						<div class="flex flex-col items-end gap-1">
							<span
								class={cn(
									'w-fit rounded-full border border-muted/20 bg-muted/10 px-2 font-currency @max-2xl:text-lg',
									row.thisMonthRemaining < 0 && 'border-error/50 bg-error/20',
									row.thisMonthRemaining > 0 && 'border-success/80 bg-success/20'
								)}
							>
								{formatCurrency(row.thisMonthRemaining)}
							</span>
							<span class="text-sm font-semibold text-muted @2xl:hidden">
								{m.budget_monthly_table_header_remaining()}
							</span>
						</div>
					</Cell>

					<Cell class="w-9 @max-2xl:order-2 @max-2xl:w-full @max-2xl:border-0 @max-2xl:last:p-2 ">
						<button
							class="flex size-9 cursor-grab items-center justify-center text-muted group-data-dragging/row:cursor-grabbing hover:text-interactive"
							aria-label="Drag Handle"
							{@attach sortable.attachHandle}
						>
							<PhDotsSixVerticalBold />
						</button>
					</Cell>
				</div>
			{/each}
		</div>
	</DragDropProvider>
</div>
