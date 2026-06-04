<script lang="ts">
	import { BudgetAccountList } from '$lib/components/budget-account-list';
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
	let selectedCategory = $derived.by(() => {
		if (!selectedCategoryId) return null;
		return (
			data.categories.find((c) => c.id === selectedCategoryId) ??
			data.archivedCategories.find((c) => c.id === selectedCategoryId) ??
			null
		);
	});
</script>

<Page.Root>
	<Page.Header class="flex-row justify-between gap-4">
		<Page.Title>
			{data.budget.name}
		</Page.Title>

		<ButtonGroup.Root>
			<BudgetSettings budgetId={params.budgetId} />

			<BudgetAccountList budgetId={params.budgetId} />

			<BudgetUserManager budgetId={params.budgetId} />
		</ButtonGroup.Root>
	</Page.Header>

	<Page.Content>
		<div class="flex items-end gap-3">
			<MonthNavigator paramsDate={createDateFromParams(data.month)} />

			<CategoryQuickActions
				archivedAmount={data.archivedCategories.length}
				form={data.forms.categoryCreate}
			/>

			<UnassignedSummary unassigned={data.unassigned} />
		</div>

		<CategoryBudgetTable
			categories={data.categories}
			openCategoryDialog={(category) => {
				selectedCategoryId = category.id;
				openCategoryDetail = true;
			}}
			assignmentForm={data.forms.monthlyAssignment}
			transferForm={data.forms.transferAssignment}
			month={data.month}
		/>
	</Page.Content>
</Page.Root>

<Dialog.Root
	bind:open={openCategoryDetail}
	onOpenChangeComplete={(isOpen) => !isOpen && (selectedCategoryId = null)}
>
	<Dialog.Content class="max-w-4xl">
		{#if selectedCategory}
			<CategoryDetail category={selectedCategory} />
		{/if}
	</Dialog.Content>
</Dialog.Root>
