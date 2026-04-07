<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '$lib/paraglide/messages';
	import { formatCentToFloatString } from '$lib/utils/formatCentToFloatString';
	import { getIntlContext } from '$lib/utils/intl-context.svelte';
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

	let { categories }: { categories: BudgetTableRow[] } = $props();

	const { locale, numberFormatOptions } = getIntlContext();

	let formatCurrency = $derived((value: number) =>
		formatValue({
			intlConfig: { locale, ...numberFormatOptions },
			value: formatCentToFloatString(value)
		})
	);

	let dragContainer: HTMLDivElement;
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

				// Handle budget reordering
				const tempItems = [...categories];
				const [movedItem] = tempItems.splice(initialIndex, 1);
				tempItems.splice(index, 0, movedItem);
				console.log(
					'Reordered budgets:',
					tempItems.map((i) => i.name)
				);
				categories = tempItems;
			}
		}}
	>
		<div
			role="rowgroup"
			bind:this={dragContainer}
			class="overflow-hidden rounded-md border border-muted/10"
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
						'group/row flex border-b border-muted/20 bg-surface last:border-b-0 hover:bg-muted/5',
						sortable.isDragging && 'border-b-0 shadow-md'
					)}
					data-dragging={sortable.isDragging ? 'true' : undefined}
					{@attach sortable.attach}
				>
					<Cell class={cn('w-2/5 flex-col items-start', row.targetBalance && 'p-0')}>
						<div class={cn('my-auto', row.targetBalance && 'ml-2')}>
							<a
								href={resolve('/(app)/[budget]/categories/[categoryId]', {
									budget: row.budgetId,
									categoryId: row.id
								})}
							>
								{row.name}
							</a>
						</div>
						{#if row.targetBalance}
							<div class="flex w-full">
								<div class="h-1.5 w-7/8 bg-success/60"></div>
							</div>
						{/if}
					</Cell>
					<Cell class="w-1/5">{formatCurrency(row.thisMonthAmount)}</Cell>
					<Cell class="w-1/5">{formatCurrency(row.thisMonthActivity)}</Cell>
					<Cell class="w-1/5">
						<div
							class={cn(
								'w-fit rounded-full border border-muted/20 bg-muted/10 px-2 font-currency',
								row.thisMonthRemaining < 0 && 'border-error/50 bg-error/20',
								row.thisMonthRemaining > 0 && 'border-success/80 bg-success/20'
							)}
						>
							{formatCurrency(row.thisMonthRemaining)}
						</div>
					</Cell>
					<Cell class="w-9">
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
