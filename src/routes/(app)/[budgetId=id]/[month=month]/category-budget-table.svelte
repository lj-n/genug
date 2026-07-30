<script lang="ts">
	import type { Month } from '$lib/utils/month';

	import { resolve } from '$app/paths';
	import { CategoryCreate } from '$lib/components/features/category';
	import { Button } from '$lib/components/ui/button';
	import { EmptyState } from '$lib/components/ui/empty-state';
	import * as ResponsiveModal from '$lib/components/ui/responsive-modal';
	import { m } from '$lib/paraglide/messages';
	import { getBudget, getMonthly } from '$lib/remote-functions/budget.remote';
	import { reorderCategories } from '$lib/remote-functions/category.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import { clamp } from '$lib/utils/clamp';
	import { asMoney, formatMoney } from '$lib/utils/money';
	import { createSortable } from '$lib/utils/sort-helper.svelte';
	import { cn } from 'tailwind-variants';
	import PhDotsSixVerticalBold from '~icons/ph/dots-six-vertical-bold';
	import PlusIcon from '~icons/ph/plus';
	import StackIcon from '~icons/ph/stack';

	import BudgetTableCell from './budget-table-cell.svelte';
	import BudgetTableHeader from './budget-table-header.svelte';
	import CategoryArchiveDrawer from './category-archive-drawer.svelte';
	import CategoryArchivePopover from './category-archive-popover.svelte';
	import CategoryAssignmentForm from './category-assignment-form.svelte';
	import CategoryAssignmentModal from './category-assignment-modal.svelte';
	import CategoryPopover from './category-popover.svelte';
	import ReassignmentPopup from './reassignment-popup.svelte';

	let {
		month
	}: {
		month: Month | null;
	} = $props();

	const budgetId = getBudgetId();

	const createHref = $derived(
		resolve('/(app)/[budgetId=id]/categories/new', { budgetId: budgetId() })
	);

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

	// Mobile assign surface (ADR-0014): one sheet for the whole table.
	let assignmentModalOpen = $state(false);
	let assignmentModalCategory = $state<(typeof categories)[number] | null>(null);

	let createDialogOpen = $state(false);

	const getPercentage = (target: number, current: number) => {
		return clamp((current / target) * 100, 0, 100);
	};
</script>

{#if categories.length === 0}
	<!-- The month check mirrors the row branch below: `categories` is transiently
	     empty while navigating away, and that must not flash the empty state. -->
	{#if month !== null}
		<EmptyState
			icon={StackIcon}
			title={m.category_table_empty_title()}
			description={m.category_table_empty_description()}
		>
			{#snippet action()}
				<Button onclick={() => (createDialogOpen = true)}>
					{m.category_table_empty_action()}
				</Button>
			{/snippet}
		</EmptyState>
	{/if}
{:else}
	<!-- The desktop column header carries create + archived, but it is hidden
	     below @3xl — surface the same actions above the cards. Outside the
	     role="table" element: a bare toolbar is not valid table content. -->
	<div class="mb-2 flex flex-wrap gap-0.5 @3xl/main:hidden">
		<Button href={createHref} class="h-11">
			<PlusIcon class="size-6" />
			{m.category_create_button()}
		</Button>
		<CategoryArchiveDrawer />
	</div>

	<div role="table">
		<div role="rowgroup" class="hidden @3xl/main:block">
			<div role="row" class="flex border-b border-muted/30 bg-muted/3">
				<!-- aria-label keeps the columnheader's accessible name as just the column
				     title; the create/archived controls inside carry their own names. -->
				<BudgetTableHeader class="w-2/5" aria-label={m.budget_monthly_table_header_category()}>
					<span class="flex items-center gap-1">
						{m.budget_monthly_table_header_category()}
						<Button
							size="xs"
							class="ml-1 @3xl/main:size-11 @7xl/main:h-6 @7xl/main:w-auto"
							aria-label={m.category_create_button()}
							onclick={() => (createDialogOpen = true)}
						>
							<PlusIcon class="size-4" />
						</Button>
						<CategoryArchivePopover />
					</span>
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
				<BudgetTableHeader class="w-9 @3xl/main:w-11 @7xl/main:w-9">
					<span class="sr-only">{m.budget_monthly_table_header_actions()}</span>
				</BudgetTableHeader>
			</div>
		</div>

		<div role="rowgroup" class="grid gap-2 @3xl/main:gap-0" {@attach categorySortable.attach}>
			<!-- The if narrows `month` for the row children; `categories` is empty when `month` is null. -->
			{#if month !== null}
				{#each categories as row (row.id)}
					<div
						data-drag-item="category"
						data-sortable-id={row.id}
						role="row"
						class="relative flex hover:bg-muted/5 @max-3xl/main:rounded-xs @max-3xl/main:border @max-3xl/main:border-muted/20 @max-3xl/main:bg-surface @3xl/main:min-h-11 @3xl/main:even:bg-muted/3 @7xl/main:min-h-0"
					>
						<BudgetTableCell class="relative hidden w-2/5 p-0 @3xl/main:flex">
							<CategoryPopover {currency} {month} {row} />
							{#if row.targetBalance !== null}
								<div class="absolute bottom-0 flex w-full">
									<div
										class="h-0.5 bg-success"
										style="width: {getPercentage(row.targetBalance, row.remaining)}%"
									></div>
								</div>
							{/if}
						</BudgetTableCell>

						<BudgetTableCell class="relative hidden w-1/5 justify-start p-0 @3xl/main:flex">
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

						<BudgetTableCell class="hidden w-1/5 font-currency @3xl/main:flex">
							{formatMoney({ currency, money: asMoney(row.activity) })}
						</BudgetTableCell>

						<BudgetTableCell class="hidden w-1/5 p-0 @3xl/main:flex">
							<ReassignmentPopup
								{month}
								categoryName={row.name}
								rowId={row.id}
								remaining={row.remaining}
								otherCategories={otherCategoriesById.get(row.id)!}
							/>
						</BudgetTableCell>

						<BudgetTableCell
							class="hidden w-9 border-0 last:p-1 @3xl/main:flex @3xl/main:w-11 @3xl/main:p-0 @7xl/main:w-9 @7xl/main:px-2 @7xl/main:py-1"
						>
							<button
								class="flex size-7 cursor-grab items-center justify-center text-muted hover:text-interactive @3xl/main:size-11 @7xl/main:size-7"
								data-drag-handle="category"
								aria-label={m.drag_handle_label()}
							>
								<PhDotsSixVerticalBold />
							</button>
						</BudgetTableCell>

						<!-- Mobile card (ADR-0014): Remaining is the headline, Assigned opens
					     the assign sheet, Activity is read-only. Drag-reorder and
					     transfers are desktop-only for now. -->
						<div role="cell" class="flex w-full flex-col py-2 @3xl/main:hidden">
							<div class="flex items-stretch">
								<a
									href={resolve('/(app)/[budgetId=id]/categories/[categoryId=id]', {
										budgetId: budgetId(),
										categoryId: row.id
									})}
									class="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center px-4 text-left"
								>
									<!-- line-clamp instead of truncate: truncate's nowrap floors the
								     card's intrinsic min-content at the full name width and forces
								     page-level horizontal overflow on phones. -->
									<span class="line-clamp-1 [overflow-wrap:anywhere]">{row.name}</span>
								</a>

								<div class="flex items-center px-4">
									<span
										class={cn(
											'font-currency font-medium',
											row.remaining < 0 && 'text-error',
											row.remaining === 0 && 'text-muted'
										)}
									>
										{formatMoney({ currency, money: asMoney(row.remaining) })}
									</span>
								</div>
							</div>

							<!-- flex-wrap: the assigned + activity pair can outgrow narrow phones
						     (longer locale strings); activity then drops to its own line. -->
							<div class="flex flex-wrap items-stretch">
								<button
									type="button"
									class="flex min-h-11 cursor-pointer items-center gap-1.5 px-4 text-sm"
									aria-label={m.budget_monthly_table_header_amount()}
									onclick={() => {
										assignmentModalCategory = row;
										assignmentModalOpen = true;
									}}
								>
									<span class="text-muted">{m.budget_monthly_table_header_amount()}</span>
									<span class="font-currency">
										{formatMoney({ currency, money: asMoney(row.assigned) })}
									</span>
								</button>

								<div class="ml-auto flex items-center gap-1.5 px-4 text-sm">
									<span class="text-muted">{m.budget_monthly_table_header_activity()}</span>
									<span class="font-currency">
										{formatMoney({ currency, money: asMoney(row.activity) })}
									</span>
								</div>
							</div>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>
{/if}

<ResponsiveModal.Root bind:open={createDialogOpen}>
	<ResponsiveModal.Content>
		<ResponsiveModal.Header>
			<ResponsiveModal.Title>{m.new_category_title()}</ResponsiveModal.Title>
			<ResponsiveModal.Description class="grid gap-4">
				<p>{m.new_category_description()}</p>
			</ResponsiveModal.Description>
		</ResponsiveModal.Header>

		<ResponsiveModal.Body>
			<CategoryCreate onSuccess={() => (createDialogOpen = false)} />
		</ResponsiveModal.Body>
	</ResponsiveModal.Content>
</ResponsiveModal.Root>

{#if month !== null}
	<CategoryAssignmentModal
		bind:open={assignmentModalOpen}
		bind:category={assignmentModalCategory}
		{currency}
		{month}
	/>
{/if}
