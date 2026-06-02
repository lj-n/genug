<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import * as Page from '$lib/components/ui/page';
	import { m } from '$lib/paraglide/messages';
	import { createMonthParam } from '$lib/utils/date-utils';
	import { formatDate } from '$lib/utils/format-date';
	import { flip } from 'svelte/animate';
	import PhArchive from '~icons/ph/archive';
	import PhHandWithdraw from '~icons/ph/hand-withdraw';

	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
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
			{#each data.categories as category (category.id)}
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
								action={resolve('/(app)/[budgetId=id]/categories/[categoryId=id]?/restore', {
									budgetId: category.budgetId,
									categoryId: category.id
								})}
								method="POST"
								use:enhance={() => {
									return async ({ update }) => {
										await update();
										await new Promise((resolve) => setTimeout(resolve, 300));
										goto(
											resolve('/(app)/[budgetId=id]/[month=month]', {
												budgetId: category.budgetId,
												month: createMonthParam().toString()
											})
										);
									};
								}}
							>
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
