<script lang="ts">
	import { AccountDropdown } from '$lib/components/account';
	import { BudgetSettings } from '$lib/components/budget-settings';
	import BudgetUserManager from '$lib/components/budget-user-manager/budget-user-manager.svelte';
	import * as ButtonGroup from '$lib/components/ui/button-group';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Page from '$lib/components/ui/page';
	import { getBudget } from '$lib/remote-functions/budget.remote';
	import { parseMonth } from '$lib/utils/month';

	import type { PageProps } from './$types';

	import CategoryDetail from '../categories/[categoryId=id]/category-detail.svelte';
	import CategoryBudgetTable from './category-budget-table.svelte';
	import CategoryQuickActions from './category-quick-actions.svelte';
	import MonthNavigator from './month-navigator.svelte';
	import UnassignedSummary from './unassigned-summary.svelte';

	let { params }: PageProps = $props();

	const budget = $derived(await getBudget(params.budgetId));

	// The matcher guarantees a valid param on this route, but during client-side
	// navigation away, `params` briefly reflects the target route (no month) while
	// this page is still mounted — month-dependent content must not query then.
	const month = $derived(parseMonth(params.month));

	let openCategoryDetail = $state(false);
	let selectedCategoryId = $state<null | string>(null);
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

				<UnassignedSummary />
			</div>

			<CategoryBudgetTable
				{month}
				openCategoryDialog={(categoryId) => {
					selectedCategoryId = categoryId;
					openCategoryDetail = true;
				}}
			/>
		{/if}
	</Page.Content>
</Page.Root>

<Dialog.Root
	bind:open={openCategoryDetail}
	onOpenChangeComplete={(isOpen) => !isOpen && (selectedCategoryId = null)}
>
	<Dialog.Content class="max-w-4xl">
		{#if selectedCategoryId}
			<CategoryDetail categoryId={selectedCategoryId} />
		{/if}
	</Dialog.Content>
</Dialog.Root>
