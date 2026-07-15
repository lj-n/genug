<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { DialogForm } from '$lib/components/ui/dialog-form';
	import * as InputGroup from '$lib/components/ui/input-group';
	import * as Select from '$lib/components/ui/select';
	import { m } from '$lib/paraglide/messages';
	import { editBudget, getBudget } from '$lib/remote-functions/budget.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import { CURRENCIES } from '$lib/utils/currencies';
	import PencilIcon from '~icons/ph/pencil';

	import { Label } from '../../ui/label';

	const budgetId = getBudgetId();

	const budget = $derived(await getBudget(budgetId()));

	const form = $derived(editBudget.for(budgetId()));
</script>

<DialogForm {form} interactOutsideBehavior="ignore">
	{#snippet trigger(props)}
		<Button {...props} variant="ghost" size="icon-lg" class="bg-muted/10 hover:bg-muted/20">
			<PencilIcon class="size-5" />
			<span class="sr-only">{m.budget_settings_title()}</span>
		</Button>
	{/snippet}

	{#snippet header()}
		<Dialog.Title>{m.budget_settings_title()}</Dialog.Title>
		<Dialog.Description class="grid gap-4">
			<p>{m.budget_settings_description()}</p>
		</Dialog.Description>
	{/snippet}

	{#snippet fields()}
		<div class="grid gap-2 rounded-lg bg-muted/5 p-3">
			<input {...editBudget.fields.budgetId.as('hidden', budgetId())} />

			<div class="grid gap-2">
				<Label>{m.budget_label_name()}</Label>
				<InputGroup.Root>
					<InputGroup.Input
						{...editBudget.fields.name.as('text', budget.name)}
						aria-label={m.budget_label_name()}
					/>
				</InputGroup.Root>
			</div>

			<div class="grid gap-2">
				<Label>{m.budget_settings_label_currency()}</Label>
				<Select.Root
					type="single"
					{...form.fields.currency.as('select', budget.currency)}
					bind:value={
						() => form.fields.currency.value() ?? budget.currency,
						(v) => form.fields.currency.set(v)
					}
				>
					<Select.Trigger class="font-semibold">
						{form.fields.currency.value() ?? budget.currency}
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
	{/snippet}

	{#snippet footer({ formId, pending })}
		<Dialog.Close class={buttonVariants({ variant: 'ghost' })}>{m.dialog_close()}</Dialog.Close>
		<Button type="submit" form={formId} loading={pending}>{m.save()}</Button>
	{/snippet}
</DialogForm>
