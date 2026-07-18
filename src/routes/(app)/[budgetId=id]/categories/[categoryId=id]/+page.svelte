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
	import { getBudget } from '$lib/remote-functions/budget.remote';
	import { getCategoryById } from '$lib/remote-functions/category.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import { currentMonth, toParam } from '$lib/utils/month';
	import { stickyParam } from '$lib/utils/sticky-param';

	import type { PageProps } from './$types';

	let { params }: PageProps = $props();

	const budgetId = getBudgetId();
	const categoryId = stickyParam(() => params.categoryId);

	const category = $derived(await getCategoryById({ categoryId: categoryId() }));
	const budget = $derived(await getBudget(budgetId()));

	// The page's stats are always scoped to the current month — there is no
	// month in this URL.
	const month = currentMonth();

	// Archived categories are managed through the archived list's restore flow,
	// not this page. Archiving here trips the same redirect: the submit
	// refreshes getCategoryById, which now carries archivedAt.
	$effect(() => {
		if (category.archivedAt !== null) {
			goto(resolve('/(app)/[budgetId=id]/categories/archived', { budgetId: budgetId() }));
		}
	});
</script>

<Page.Root>
	<Page.Header>
		<Page.Title>
			{category.name}
		</Page.Title>
	</Page.Header>

	<Page.Content>
		<!-- The tiles' @3xl breakpoint used to resolve against the dialog body's
		     unnamed container — the page provides its own. -->
		<div class="@container">
			<div class="grid gap-6 @3xl:grid-cols-2">
				<CategoryEdit {category} currency={budget.currency} />

				<CategoryStats {category} currency={budget.currency} {month} />

				<CategoryArchive {category} currency={budget.currency} />

				<CategoryDelete
					{category}
					currency={budget.currency}
					onDeleted={() =>
						goto(
							resolve('/(app)/[budgetId=id]/[month=month]', {
								budgetId: budgetId(),
								month: toParam(currentMonth())
							})
						)}
				/>
			</div>
		</div>
	</Page.Content>
</Page.Root>
