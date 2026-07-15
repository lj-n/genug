<script lang="ts">
	import { resolve } from '$app/paths';
	import { CategoryCreate } from '$lib/components/features/category';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { m } from '$lib/paraglide/messages';
	import { getArchivedCategories } from '$lib/remote-functions/category.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import PhArchive from '~icons/ph/archive';
	import PhStackPlus from '~icons/ph/stack-plus';

	const budgetId = getBudgetId();

	const archivedCategories = $derived(await getArchivedCategories({ budgetId: budgetId() }));

	let open = $state(false);
</script>

<div class="flex flex-wrap gap-0.5">
	<Button
		href={resolve('/(app)/[budgetId=id]/categories/new', { budgetId: budgetId() })}
		class="md:hidden @max-3xl/main:h-11"
	>
		<PhStackPlus class="size-6" />
		{m.category_create_button()}
	</Button>

	<Button class="hidden md:flex @max-3xl/main:h-11" onclick={() => (open = true)}>
		<PhStackPlus class="size-6" />
		{m.category_create_button()}
	</Button>

	<Button
		variant="ghost"
		class="@max-3xl/main:h-11"
		href={resolve('/(app)/[budgetId=id]/categories/archived', { budgetId: budgetId() })}
	>
		<PhArchive class="size-6" />
		{m.category_archived_link({ amount: archivedCategories.length })}
	</Button>
</div>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-lg gap-6">
		<Dialog.Header>
			<Dialog.Title>{m.new_category_title()}</Dialog.Title>
			<Dialog.Description class="grid gap-4">
				<p>{m.new_category_description()}</p>
			</Dialog.Description>
		</Dialog.Header>

		<CategoryCreate onSuccess={() => (open = false)} />
	</Dialog.Content>
</Dialog.Root>
