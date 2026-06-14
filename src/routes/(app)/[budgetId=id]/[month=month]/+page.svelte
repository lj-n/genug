<script lang="ts">
	import { AccountDropdown } from '$lib/components/account';
	import { BudgetSettings } from '$lib/components/budget-settings';
	import BudgetUserManager from '$lib/components/budget-user-manager/budget-user-manager.svelte';
	import * as ButtonGroup from '$lib/components/ui/button-group';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Page from '$lib/components/ui/page';
	import { createDateFromParams } from '$lib/utils/create-date-from-params';

	import type { PageProps } from './$types';

	import CategoryDetail from '../categories/[categoryId=id]/category-detail.svelte';
	import CategoryBudgetTable from './category-budget-table.svelte';
	import CategoryQuickActions from './category-quick-actions.svelte';
	import MonthNavigator from './month-navigator.svelte';
	import UnassignedSummary from './unassigned-summary.svelte';

	let { data, params }: PageProps = $props();

	let openCategoryDetail = $state(false);
	let selectedCategoryId = $state<null | string>(null);
</script>

<Page.Root>
	<Page.Header class="flex-row justify-between gap-4">
		<Page.Title>
			{data.budget.name}
		</Page.Title>

		<ButtonGroup.Root>
			<BudgetSettings budgetId={params.budgetId} />

			<AccountDropdown budgetId={params.budgetId} />

			<BudgetUserManager budgetId={params.budgetId} />
		</ButtonGroup.Root>
	</Page.Header>

	<Page.Content>
		<div class="flex items-end gap-3">
			<MonthNavigator paramsDate={createDateFromParams(params.month)} />

			<CategoryQuickActions budgetId={params.budgetId} />

			<UnassignedSummary budgetId={params.budgetId} />
		</div>

		<CategoryBudgetTable
			budgetId={params.budgetId}
			month={params.month}
			openCategoryDialog={(categoryId) => {
				selectedCategoryId = categoryId;
				openCategoryDetail = true;
			}}
		/>
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
