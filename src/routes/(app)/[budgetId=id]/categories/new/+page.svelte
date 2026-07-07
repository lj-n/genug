<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Input } from '$lib/components/ui/input';
	import * as Page from '$lib/components/ui/page';
	import { m } from '$lib/paraglide/messages';
	import { createCategory } from '$lib/remote-functions/category.remote';
	import PhStack from '~icons/ph/stack';

	const budgetId = page.params.budgetId!;
	const formId = $props.id();
</script>

<Page.Root class="max-w-lg">
	<Page.Header>
		<Page.Title>
			{m.new_category_title()}
		</Page.Title>
		<Page.Description>
			<PhStack class="mr-2 inline size-8 align-bottom" />
			{m.new_category_description()}
		</Page.Description>
	</Page.Header>

	<Page.Content>
		<form
			{...createCategory.enhance(async (form) => {
				if (await form.submit()) {
					goto(resolve('/(app)/[budgetId=id]', { budgetId }));
				}
			})}
			id={formId}
			class="grid rounded-md border border-muted/20 bg-surface p-2"
		>
			<input {...createCategory.fields.budgetId.as('hidden', budgetId)} />

			<Input
				{...createCategory.fields.categoryName.as('text')}
				placeholder={m.category_placeholder_name()}
				aria-label={m.category_label_name()}
			/>

			{#each createCategory.fields.categoryName.issues() as issue (issue)}
				<p class="mt-1 pl-1.5 text-sm text-error">{issue.message}</p>
			{/each}

			<button type="submit" class="mt-2 ml-auto rounded px-3 py-1.5 text-sm font-medium">
				{m.category_create_button()}
			</button>
		</form>
	</Page.Content>
</Page.Root>
