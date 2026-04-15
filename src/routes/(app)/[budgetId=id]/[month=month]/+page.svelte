<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Page from '$lib/components/ui/page';
	import { Separator } from '$lib/components/ui/separator';
	import { createDateFromParams } from '$lib/utils/create-date-from-params';

	import type { PageProps } from './$types';

	import CategoryDetail from '../categories/[categoryId=id]/category-detail.svelte';
	import AccountList from './account-list.svelte';
	import BudgetActions from './budget-actions.svelte';
	import BudgetTable from './budget-table.svelte';
	import MonthSwitch from './month-switch.svelte';
	import Unassigned from './unassigned.svelte';

	let { data }: PageProps = $props();

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
	<Page.Header>
		<Page.Title>
			{data.budget.name}
		</Page.Title>
	</Page.Header>

	<Page.Content>
		<div class="flex justify-between gap-6">
			<AccountList accounts={data.budget.accounts} />

			<Unassigned unassigned={data.unassigned} />
		</div>

		<Separator orientation="horizontal" />

		<div class="flex items-end justify-between">
			<MonthSwitch paramsDate={createDateFromParams(data.month)} />

			<BudgetActions
				archivedAmount={data.archivedCategories.length}
				budgetId={data.budget.id}
				form={data.createCategoryForm}
			/>
		</div>

		<BudgetTable
			categories={data.categories}
			openCategoryDialog={(category) => {
				selectedCategoryId = category.id;
				openCategoryDetail = true;
			}}
			assignmentForm={data.assignmentForm}
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
