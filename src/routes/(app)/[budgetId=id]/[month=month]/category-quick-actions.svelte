<script lang="ts">
	import { resolve } from '$app/paths';
	import { CategoryCreate } from '$lib/components/features/category';
	import { Button } from '$lib/components/ui/button';
	import * as ResponsiveModal from '$lib/components/ui/responsive-modal';
	import { m } from '$lib/paraglide/messages';
	import { getArchivedCategories } from '$lib/remote-functions/category.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import PhArchive from '~icons/ph/archive';
	import PhStackPlus from '~icons/ph/stack-plus';

	// After the last category is archived the month view drops the navigator
	// row, but the archive must stay reachable — the page then renders this
	// component with `showCreate` off, leaving only the archived link.
	let { showCreate = true }: { showCreate?: boolean } = $props();

	const budgetId = getBudgetId();

	const archivedCategories = $derived(await getArchivedCategories({ budgetId: budgetId() }));

	let open = $state(false);
</script>

<div class="flex flex-wrap gap-0.5">
	{#if showCreate}
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
	{/if}

	{#if archivedCategories.length > 0}
		<Button
			variant="ghost"
			class="@max-3xl/main:h-11"
			href={resolve('/(app)/[budgetId=id]/categories/archived', { budgetId: budgetId() })}
		>
			<PhArchive class="size-6" />
			{m.category_archived_link({ amount: archivedCategories.length })}
		</Button>
	{/if}
</div>

<ResponsiveModal.Root bind:open>
	<ResponsiveModal.Content>
		<ResponsiveModal.Header>
			<ResponsiveModal.Title>{m.new_category_title()}</ResponsiveModal.Title>
			<ResponsiveModal.Description class="grid gap-4">
				<p>{m.new_category_description()}</p>
			</ResponsiveModal.Description>
		</ResponsiveModal.Header>

		<ResponsiveModal.Body>
			<CategoryCreate onSuccess={() => (open = false)} />
		</ResponsiveModal.Body>
	</ResponsiveModal.Content>
</ResponsiveModal.Root>
