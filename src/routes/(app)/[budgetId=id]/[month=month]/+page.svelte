<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as ButtonGroup from '$lib/components/ui/button-group';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Page from '$lib/components/ui/page';
	import { Separator } from '$lib/components/ui/separator';
	import { m } from '$lib/paraglide/messages';
	import { createDateFromParams } from '$lib/utils/create-date-from-params';
	import PencilIcon from '~icons/ph/pencil';

	import type { PageProps } from './$types';

	import CategoryDetail from '../categories/[categoryId=id]/category-detail.svelte';
	import BudgetAccountList from './budget-account-list.svelte';
	import BudgetUserManager from './budget-user-manager.svelte';
	import CategoryBudgetTable from './category-budget-table.svelte';
	import CategoryQuickActions from './category-quick-actions.svelte';
	import MonthNavigator from './month-navigator.svelte';
	import UnassignedSummary from './unassigned-summary.svelte';

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
	<Page.Header class="flex-row justify-between gap-4">
		<Page.Title>
			{data.budget.name}
		</Page.Title>

		<ButtonGroup.Root>
			<Button variant="ghost" size="icon-lg" class="bg-muted/10 hover:bg-muted/20">
				<PencilIcon class="size-5" />
				<span class="sr-only">
					{m.settings_title()}
				</span>
			</Button>

			<BudgetUserManager users={data.users} form={data.formInviteUser} />
		</ButtonGroup.Root>
	</Page.Header>

	<Page.Content>
		<div class="flex justify-between gap-6">
			<BudgetAccountList
				accounts={data.budget.accounts}
				createAccountForm={data.createAccountForm}
				budgetId={data.budget.id}
			/>

			<UnassignedSummary unassigned={data.unassigned} />
		</div>

		<Separator orientation="horizontal" />

		<div class="flex items-end justify-between">
			<MonthNavigator paramsDate={createDateFromParams(data.month)} />

			<CategoryQuickActions
				archivedAmount={data.archivedCategories.length}
				budgetId={data.budget.id}
				form={data.createCategoryForm}
			/>
		</div>

		<CategoryBudgetTable
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
