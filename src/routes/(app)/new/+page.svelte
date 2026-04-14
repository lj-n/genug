<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import * as Page from '$lib/components/ui/page';
	import { m } from '$lib/paraglide/messages';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import PhScales from '~icons/ph/scales';

	import type { PageProps } from './$types';

	import { schema } from './schema';

	let { data }: PageProps = $props();

	const form = superForm(
		untrack(() => data.form),
		{
			validators: zod4Client(schema)
		}
	);

	const { enhance, form: formData } = form;
</script>

<Page.Root>
	<Page.Header>
		<Page.Title>
			{data.isFirstBudget ? m.new_first_budget_title() : m.new_budget_title()}
		</Page.Title>
		<Page.Description>
			<PhScales class="mr-2 inline size-8 align-bottom" />
			{m.new_budget_description()}
		</Page.Description>
	</Page.Header>

	<Page.Content>
		<form method="post" use:enhance class="grid rounded-md border border-muted/20 bg-surface p-2">
			<Form.Field {form} name="budgetName">
				<Form.Control>
					{#snippet children({ props })}
						<Input
							{...props}
							bind:value={$formData.budgetName}
							placeholder={m.budget_placeholder_name()}
							aria-label={m.budget_label_name()}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Button class="ml-auto">
				{m.budget_create_button()}
			</Form.Button>
		</form>
	</Page.Content>
</Page.Root>
