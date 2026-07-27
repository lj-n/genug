<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { FormField } from '$lib/components/ui/form-field';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Page from '$lib/components/ui/page';
	import * as Select from '$lib/components/ui/select';
	import { m } from '$lib/paraglide/messages';
	import { createBudget, getBudgets } from '$lib/remote-functions/budget.remote';
	import { CURRENCIES } from '$lib/utils/currencies';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';

	const budgets = $derived(await getBudgets());
	const isFirstBudget = $derived(budgets.length === 0);

	// Create-then-navigate: the redirect is the success signal, no toast.
	const submit = createFormSubmit(() => createBudget, { toast: {} });
</script>

<Page.Root class="max-w-lg">
	<Page.Header>
		<Page.Title>
			{isFirstBudget ? m.new_first_budget_title() : m.new_budget_title()}
		</Page.Title>
		<Page.Description>
			{m.new_budget_description()}
		</Page.Description>
	</Page.Header>

	<Page.Content>
		<form {...submit.attrs} class="grid gap-2">
			<div class="flex items-end gap-2">
				<FormField field={createBudget.fields.name} label={m.budget_label_name()} class="flex-1">
					{#snippet input(field)}
						<Input {...field.as('text')} placeholder={m.budget_placeholder_name()} />
					{/snippet}
				</FormField>

				<div class="grid gap-2">
					<Label>{m.budget_settings_label_currency()}</Label>
					<Select.Root
						type="single"
						name={createBudget.fields.currency.as('select').name}
						bind:value={
							() => createBudget.fields.currency.value() ?? CURRENCIES[0],
							(v) => createBudget.fields.currency.set(v)
						}
					>
						<Select.Trigger class="font-semibold">
							{createBudget.fields.currency.value() ?? CURRENCIES[0]}
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								<Select.Label>{m.budget_settings_available_currencies()}</Select.Label>
								{#each CURRENCIES as currency (currency)}
									<Select.Item value={currency} label={currency} class="font-semibold">
										{currency}
									</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</div>
			</div>

			<Button type="submit" class="ml-auto" loading={submit.pending} {@attach submit.anchor}>
				{m.budget_create_button()}
			</Button>
		</form>
	</Page.Content>
</Page.Root>
