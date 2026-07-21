<script lang="ts">
	import { AccountDropdown } from '$lib/components/features/account';
	import { BudgetSettings } from '$lib/components/features/budget-settings';
	import { BudgetUserManager } from '$lib/components/features/budget-user-manager';
	import * as ButtonGroup from '$lib/components/ui/button-group';
	import * as Page from '$lib/components/ui/page';
	import { getBudget, getMonthly } from '$lib/remote-functions/budget.remote';
	import { getArchivedCategories } from '$lib/remote-functions/category.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import { parseMonth } from '$lib/utils/month';

	import type { PageProps } from './$types';

	import CategoryBudgetTable from './category-budget-table.svelte';
	import CategoryQuickActions from './category-quick-actions.svelte';
	import MonthNavigator from './month-navigator.svelte';
	import TutorialCard from './tutorial-card.svelte';
	import UnassignedSummary from './unassigned-summary.svelte';

	let { params }: PageProps = $props();

	const budgetId = getBudgetId();

	const budget = $derived(await getBudget(budgetId()));

	// The matcher guarantees a valid param on this route, but during client-side
	// navigation away, `params` briefly reflects the target route (no month) while
	// this page is still mounted — month-dependent content must not query then.
	const month = $derived(parseMonth(params.month));

	// Shared with the category table (same query, no extra round-trip): the
	// month navigator, quick actions, and unassigned summary only appear once
	// the budget has a category — before that the tutorial card and the
	// table's empty state are the whole view.
	const categories = $derived(
		await (month === null ? Promise.resolve([]) : getMonthly({ budgetId: budgetId(), month }))
	);
	// Already loaded by the quick actions (cached): with no active category
	// left, the archived link must still be reachable below.
	const archivedCategories = $derived(await getArchivedCategories({ budgetId: budgetId() }));
</script>

<Page.Root class="gap-4">
	<Page.Header class="flex-row flex-wrap justify-between gap-4">
		<Page.Title>
			{budget.name}
		</Page.Title>

		<ButtonGroup.Root>
			<BudgetSettings />

			<AccountDropdown />

			<BudgetUserManager />
		</ButtonGroup.Root>
	</Page.Header>

	<Page.Content class="gap-y-4">
		{#if month !== null}
			<TutorialCard {month} />

			{#if categories.length > 0}
				<!-- Prominent-stack below @3xl (ADR-0014): navigator row first, then the
				     unassigned summary as a full-width band. -->
				<div class="flex flex-col gap-3 @3xl/main:flex-row @3xl/main:items-end">
					<div class="flex flex-wrap items-end gap-3">
						<MonthNavigator {month} />

						<CategoryQuickActions />
					</div>

					<UnassignedSummary {month} />
				</div>
			{:else if archivedCategories.length > 0}
				<!-- The last category was archived: keep the archive reachable, but
				     without navigator, create button, or unassigned summary. -->
				<CategoryQuickActions showCreate={false} />
			{/if}

			<CategoryBudgetTable {month} />
		{/if}
	</Page.Content>
</Page.Root>
