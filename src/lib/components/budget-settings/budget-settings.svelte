<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as InputGroup from '$lib/components/ui/input-group';
	import * as Select from '$lib/components/ui/select';
	import { m } from '$lib/paraglide/messages';
	import { getBudget, setBudget } from '$lib/remote-functions/budget.remote';
	import { CURRENCIES } from '$lib/utils/currencies';
	import PencilIcon from '~icons/ph/pencil';

	import { Label } from '../ui/label';

	let { budgetId }: { budgetId: string } = $props();

	const budget = $derived(await getBudget({ budgetId }));

	let open = $state(false);

	const formId = $props.id();
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="icon-lg" class="bg-muted/10 hover:bg-muted/20">
				<PencilIcon class="size-5" />
				<span class="sr-only">{m.budget_settings_title()}</span>
			</Button>
		{/snippet}
	</Dialog.Trigger>

	<Dialog.Content class="max-w-lg gap-0" interactOutsideBehavior="ignore">
		<Dialog.Header>
			<Dialog.Title>{m.budget_settings_title()}</Dialog.Title>
			<Dialog.Description class="grid gap-4">
				<p>{m.budget_settings_description()}</p>
			</Dialog.Description>
		</Dialog.Header>

		<form
			{...setBudget.enhance(async (form) => {
				try {
					if (await form.submit()) {
						open = false;
					}
				} catch (error) {
					console.error(error);
				}
			})}
			id={formId}
			class="mt-6 grid gap-2 rounded-lg bg-muted/5 p-3"
		>
			<input {...setBudget.fields.budgetId.as('hidden', budgetId)} />

			<div class="grid gap-2">
				<Label>{m.budget_label_name()}</Label>
				<InputGroup.Root>
					<InputGroup.Input {...setBudget.fields.name.as('text', budget.name)} />
				</InputGroup.Root>
			</div>

			<div class="grid gap-2">
				<Label>{m.budget_settings_label_currency()}</Label>
				<Select.Root
					type="single"
					{...setBudget.fields.currency.as('select', budget.currency)}
					bind:value={
						() => setBudget.fields.currency.value() ?? budget.currency,
						(v) => setBudget.fields.currency.set(v)
					}
				>
					<Select.Trigger class="font-semibold">
						{setBudget.fields.currency.value() ?? budget.currency}
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
		</form>

		<Dialog.Footer class="mt-6">
			<Dialog.Close class={buttonVariants({ variant: 'ghost' })}>{m.dialog_close()}</Dialog.Close>
			<Button type="submit" form={formId}>{m.save()}</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
