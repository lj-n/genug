<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Popover from '$lib/components/ui/popover';
	import { m } from '$lib/paraglide/messages';
	import { createCategory, getArchivedCategories } from '$lib/remote-functions/category.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import PhArchive from '~icons/ph/archive';
	import PhStackPlus from '~icons/ph/stack-plus';

	const budgetId = getBudgetId();

	const archivedCategories = $derived(await getArchivedCategories({ budgetId: budgetId() }));

	let open = $state(false);
</script>

<div class="flex gap-0.5">
	<Popover.Root bind:open>
		<Button href={resolve('/(app)/[budgetId=id]/categories/new', { budgetId: budgetId() })} class="md:hidden">
			<PhStackPlus class="size-6" />
			{m.category_create_button()}
		</Button>

		<Popover.Trigger>
			{#snippet child({ props })}
				<Button {...props} class="hidden md:flex">
					<PhStackPlus class="size-6" />
					{m.category_create_button()}
				</Button>
			{/snippet}
		</Popover.Trigger>

		<Popover.Content align="end" class="w-fit p-4">
			<form
				{...createCategory.enhance(async (form) => {
					if (await form.submit()) {
						open = false;
						form.element.reset();
					}
				})}
			>
				<input {...createCategory.fields.budgetId.as('hidden', budgetId())} />
				<Input
					{...createCategory.fields.categoryName.as('text')}
					placeholder={m.category_placeholder_name()}
					aria-label={m.category_label_name()}
				/>
			</form>
		</Popover.Content>
	</Popover.Root>

	<Button variant="ghost" href={resolve('/(app)/[budgetId=id]/categories/archived', { budgetId: budgetId() })}>
		<PhArchive class="size-6" />
		{m.category_archived_link({ amount: archivedCategories.length })}
	</Button>
</div>
