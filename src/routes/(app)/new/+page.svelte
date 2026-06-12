<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Page from '$lib/components/ui/page';
	import * as Select from '$lib/components/ui/select';
	import { m } from '$lib/paraglide/messages';
	import { createBudget, getBudgets } from '$lib/remote-functions/budget.remote';
	import { CURRENCIES } from '$lib/utils/currencies';
	import PhScales from '~icons/ph/scales';

	const budgets = $derived(await getBudgets());
	const isFirstBudget = $derived(budgets.length === 0);
</script>

<Page.Root class="max-w-lg">
	<Page.Header>
		<Page.Title>
			{isFirstBudget ? m.new_first_budget_title() : m.new_budget_title()}
		</Page.Title>
		<Page.Description>
			<PhScales class="mr-2 inline size-8 align-bottom" />
			{m.new_budget_description()}
		</Page.Description>
	</Page.Header>

	<Page.Content>
		<form {...createBudget} class="grid gap-2 rounded-md border border-muted/20 bg-surface p-2">
			<div class="grid gap-2">
				<Label>{m.budget_label_name()}</Label>
				<Input
					{...createBudget.fields.name.as('text')}
					placeholder={m.budget_placeholder_name()}
					aria-label={m.budget_label_name()}
				/>
			</div>

			<div class="grid gap-2">
				<Label>{m.budget_settings_label_currency()}</Label>
				<Select.Root
					type="single"
					{...createBudget.fields.currency.as('select')}
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

			<Button type="submit" class="ml-auto">
				{m.budget_create_button()}
			</Button>
		</form>
	</Page.Content>
</Page.Root>
