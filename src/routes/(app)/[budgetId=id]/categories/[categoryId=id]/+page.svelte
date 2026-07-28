<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import {
		CategoryArchive,
		CategoryDelete,
		CategoryEdit,
		CategoryStats
	} from '$lib/components/features/category';
	import * as Page from '$lib/components/ui/page';
	import { Separator } from '$lib/components/ui/separator';
	import { getBudget } from '$lib/remote-functions/budget.remote';
	import { getCategoryById } from '$lib/remote-functions/category.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import { currentMonth, toParam } from '$lib/utils/month';
	import { stickyParam } from '$lib/utils/sticky-param';

	import type { PageProps } from './$types';

	// PROTOTYPE (#334): disclaimer + restore replaces the archived redirect.
	import PrototypeCategoryArchivedNotice from './prototype-category-archived-notice.svelte';

	let { params }: PageProps = $props();

	const budgetId = getBudgetId();
	const categoryId = stickyParam(() => params.categoryId);

	const category = $derived(await getCategoryById({ categoryId: categoryId() }));
	const budget = $derived(await getBudget(budgetId()));

	// The page's stats are always scoped to the current month — there is no
	// month in this URL.
	const month = currentMonth();

	const onDeleted = () =>
		goto(
			resolve('/(app)/[budgetId=id]/[month=month]', {
				budgetId: budgetId(),
				month: toParam(currentMonth())
			})
		);
</script>

<Page.Root>
	<Page.Header>
		<Page.Title>
			{category.name}
		</Page.Title>
	</Page.Header>

	<Page.Content class="max-w-xl">
		<!-- PROTOTYPE (#334): an archived category's page is nothing but the
		     disclaimer + restore (was: redirect to the archived-list page). -->
		{#if category.archivedAt !== null}
			<PrototypeCategoryArchivedNotice categoryId={categoryId()} />
		{:else}
			<div class="space-y-3">
				<CategoryEdit {category} currency={budget.currency} />

				<Separator class="mt-6 mb-3" />

				<CategoryStats {category} currency={budget.currency} {month} />

				<Separator class="mt-6 mb-3" />

				<CategoryArchive {category} currency={budget.currency} />

				<Separator class="mt-6 mb-3" />

				<CategoryDelete {category} currency={budget.currency} {onDeleted} />
			</div>
		{/if}
	</Page.Content>
</Page.Root>
