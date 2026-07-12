<script lang="ts">
	import { AccountDropdown } from '$lib/components/features/account';
	import { BudgetSettings } from '$lib/components/features/budget-settings';
	import { BudgetUserManager } from '$lib/components/features/budget-user-manager';
	import { CategoryDetailDialog } from '$lib/components/features/category';
	import * as ButtonGroup from '$lib/components/ui/button-group';
	import * as Page from '$lib/components/ui/page';
	import { getBudget } from '$lib/remote-functions/budget.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import { parseMonth } from '$lib/utils/month';

	import type { PageProps } from './$types';

	import CategoryBudgetTable from './category-budget-table.svelte';
	import CategoryQuickActions from './category-quick-actions.svelte';
	import MonthNavigator from './month-navigator.svelte';
	import UnassignedSummary from './unassigned-summary.svelte';

	let { params }: PageProps = $props();

	const budgetId = getBudgetId();

	const budget = $derived(await getBudget(budgetId()));

	// The matcher guarantees a valid param on this route, but during client-side
	// navigation away, `params` briefly reflects the target route (no month) while
	// this page is still mounted — month-dependent content must not query then.
	const month = $derived(parseMonth(params.month));

	let selectedCategoryId = $state<null | string>(null);
	let categoryDialogOpen = $state(false);
</script>

<Page.Root>
	<Page.Header class="flex-row justify-between gap-4">
		<Page.Title>
			{budget.name}
		</Page.Title>

		<ButtonGroup.Root>
			<BudgetSettings />

			<AccountDropdown />

			<BudgetUserManager />
		</ButtonGroup.Root>
	</Page.Header>

	<Page.Content>
		{#if month !== null}
			<div class="flex items-end gap-3">
				<MonthNavigator {month} />

				<CategoryQuickActions />

				<UnassignedSummary {month} />
			</div>

			<CategoryBudgetTable
				{month}
				openCategoryDialog={(categoryId) => {
					selectedCategoryId = categoryId;
					categoryDialogOpen = true;
				}}
			/>
		{/if}
	</Page.Content>
</Page.Root>

<CategoryDetailDialog bind:categoryId={selectedCategoryId} bind:open={categoryDialogOpen} />
