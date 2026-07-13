<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { FormField } from '$lib/components/ui/form-field';
	import { Input } from '$lib/components/ui/input';
	import * as Page from '$lib/components/ui/page';
	import { m } from '$lib/paraglide/messages';
	import { createCategory } from '$lib/remote-functions/category.remote';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';
	import PhStack from '~icons/ph/stack';

	const budgetId = page.params.budgetId!;
	const formId = $props.id();

	// Create-then-navigate: the redirect is the success signal, no toast.
	const submit = createFormSubmit(() => createCategory, {
		onSuccess: () => {
			goto(resolve('/(app)/[budgetId=id]', { budgetId }));
		},
		toast: {}
	});
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
			{...submit.attrs}
			id={formId}
			class="grid rounded-md border border-muted/20 bg-surface p-2"
		>
			<input {...createCategory.fields.budgetId.as('hidden', budgetId)} />

			<FormField
				field={createCategory.fields.categoryName}
				label={m.category_label_name()}
				hideLabel
			>
				{#snippet input(field)}
					<Input {...field.as('text')} placeholder={m.category_placeholder_name()} />
				{/snippet}
			</FormField>

			<Button type="submit" class="mt-2 ml-auto" loading={submit.pending} {@attach submit.anchor}>
				{m.category_create_button()}
			</Button>
		</form>
	</Page.Content>
</Page.Root>
