<script lang="ts">
	import { resolve } from '$app/paths';
	import * as Page from '$lib/components/ui/page';
	import { m } from '$lib/paraglide/messages';
	import { getArchivedCategories } from '$lib/remote-functions/category.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import { formatDate } from '$lib/utils/format-date';
	import { currentMonth, toParam } from '$lib/utils/month';
	import { flip } from 'svelte/animate';
	import PhArchive from '~icons/ph/archive';

	import RestoreCategoryForm from './restore-category-form.svelte';

	const budgetId = getBudgetId();

	const categories = $derived(await getArchivedCategories({ budgetId: budgetId() }));
</script>

<Page.Root>
	<Page.Header>
		<Page.Title>
			{m.category_archive_title()}</Page.Title
		>
		<Page.Description>
			<PhArchive class="inline size-6" />
			{m.category_archive_description()}
		</Page.Description>
	</Page.Header>

	<Page.Content>
		<ul class="space-y-2">
			{#each categories as category (category.id)}
				<li animate:flip={{ duration: 300 }}>
					<div class="group flex rounded-md border border-muted/20 bg-surface p-2 shadow-xs">
						<div class="flex flex-col gap-1">
							<a
								href={resolve('/(app)/[budgetId=id]/[month=month]', {
									budgetId: category.budgetId,
									month: toParam(currentMonth())
								})}
								class="hover:underline"
							>
								{category.name}
							</a>
							<span class="flex items-center gap-1 text-sm text-muted">
								<PhArchive />
								{formatDate({
									date: new Date(category.archivedAt!),
									options: { dateStyle: 'medium', timeStyle: 'short' }
								})}
							</span>
						</div>
						<div
							class="ml-auto opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
						>
							<RestoreCategoryForm budgetId={category.budgetId} categoryId={category.id} />
						</div>
					</div>
				</li>
			{/each}
		</ul>
	</Page.Content>
</Page.Root>
