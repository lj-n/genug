<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import * as Page from '$lib/components/ui/page';
	import { m } from '$lib/paraglide/messages';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import PhPiggyBankDuotone from '~icons/ph/piggy-bank-duotone';

	import type { PageProps } from './$types';

	import { schemaAccountCreate } from './schema';

	let { data }: PageProps = $props();

	const form = superForm(
		untrack(() => data.form),
		{
			onUpdated: (event) => {
				if (event.form.message?.type === 'success') {
					goto(resolve('/(app)/[budgetId=id]', { budgetId: data.budget.id }));
				}
			},
			validators: zod4Client(schemaAccountCreate)
		}
	);

	const { enhance, form: formData } = form;
</script>

<Page.Root class="max-w-lg">
	<Page.Header>
		<Page.Title>
			{data.isFirstAccount ? m.new_first_account_title() : m.new_account_title()}
		</Page.Title>

		<Page.Description>
			<PhPiggyBankDuotone class="mr-2 inline size-8 align-bottom" />
			{m.new_account_description()}
		</Page.Description>
	</Page.Header>

	<Page.Content>
		<form method="post" use:enhance class="grid rounded-md border border-muted/20 bg-surface p-2">
			<Form.Field {form} name="accountName">
				<Form.Control>
					{#snippet children({ props })}
						<Input
							{...props}
							bind:value={$formData.accountName}
							placeholder={m.account_placeholder_name()}
							aria-label={m.account_label_name()}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Button class="ml-auto">
				{m.account_create_button()}
			</Form.Button>
		</form>
	</Page.Content>
</Page.Root>
