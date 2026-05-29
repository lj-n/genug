<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import * as Page from '$lib/components/ui/page';
	import { m } from '$lib/paraglide/messages';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import PhStack from '~icons/ph/stack';

	import type { PageProps } from './$types';

	import { schemaCategoryCreate } from './schema';

	let { data }: PageProps = $props();

	const form = superForm(
		untrack(() => data.form),
		{
			validators: zod4Client(schemaCategoryCreate)
		}
	);

	const { enhance, form: formData } = form;
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
		<form method="post" use:enhance class="grid rounded-md border border-muted/20 bg-surface p-2">
			<Form.Field {form} name="categoryName">
				<Form.Control>
					{#snippet children({ props })}
						<Input
							{...props}
							bind:value={$formData.categoryName}
							placeholder={m.category_placeholder_name()}
							aria-label={m.category_label_name()}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Button class="ml-auto">
				{m.category_create_button()}
			</Form.Button>
		</form>
	</Page.Content>
</Page.Root>
