<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import * as Page from '$lib/components/ui/page';
	import { m } from '$lib/paraglide/messages';
	import { getArchivedCategories, restoreCategory } from '$lib/remote-functions/category.remote';
	import { formatDate } from '$lib/utils/format-date';
	import { currentMonth, toParam } from '$lib/utils/month';
	import { flip } from 'svelte/animate';
	import PhArchive from '~icons/ph/archive';
	import PhHandWithdraw from '~icons/ph/hand-withdraw';

	const budgetId = page.params.budgetId!;

	const categories = $derived(await getArchivedCategories({ budgetId }));
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
								href={resolve('/(app)/[budgetId=id]/categories/[categoryId=id]', {
									budgetId: category.budgetId,
									categoryId: category.id
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
							<form
								{...restoreCategory.enhance(async (form) => {
									if (await form.submit()) {
										await new Promise((r) => setTimeout(r, 300));
										goto(
											resolve('/(app)/[budgetId=id]/[month=month]', {
												budgetId: category.budgetId,
												month: toParam(currentMonth())
											})
										);
									}
								})}
							>
								<input {...restoreCategory.fields.categoryId.as('hidden', category.id)} />
								<Button type="submit">
									<PhHandWithdraw class="size-4" />
									{m.category_archive_restore_button()}
								</Button>
							</form>
						</div>
					</div>
				</li>
			{/each}
		</ul>
	</Page.Content>
</Page.Root>
