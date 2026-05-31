<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Form from '$lib/components/ui/form';
	import * as InputGroup from '$lib/components/ui/input-group';
	import * as Select from '$lib/components/ui/select';
	import { m } from '$lib/paraglide/messages';
	import { getBudgetContext } from '$lib/utils/budget-context';
	import { CURRENCIES } from '$lib/utils/currencies';
	import { untrack } from 'svelte';
	import { type Infer, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import PencilIcon from '~icons/ph/pencil';

	import { schemaEditBudget } from '../schema';

	let { form: editBudgetForm }: { form: SuperValidated<Infer<typeof schemaEditBudget>> } = $props();

	const budget = getBudgetContext();

	const form = superForm(
		untrack(() => editBudgetForm),
		{
			onUpdated(event) {
				if (event.form.message?.type === 'success') {
					open = false;
				}
			},
			validators: zod4Client(schemaEditBudget)
		}
	);

	const { enhance, form: formData, formId } = form;

	let open = $state(true);
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="icon-lg" class="bg-muted/10 hover:bg-muted/20">
				<PencilIcon class="size-5" />
				<span class="sr-only"> Budget Einstellungen </span>
			</Button>
		{/snippet}
	</Dialog.Trigger>

	<Dialog.Content class="max-w-lg gap-0" interactOutsideBehavior="ignore">
		<Dialog.Header>
			<Dialog.Title>Budget Einstellungen</Dialog.Title>
			<Dialog.Description class="grid gap-4">
				<p>Hier kannst du Namen und Währung des Budgetplans ändern.</p>
			</Dialog.Description>
		</Dialog.Header>

		<form
			id={$formId}
			class="mt-6 grid gap-2 rounded-lg bg-muted/5 p-3"
			use:enhance
			method="post"
			action={resolve('/(app)/[budgetId=id]?/editBudget', {
				budgetId: budget().id
			})}
		>
			<Form.Field {form} name="name">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Budget Name</Form.Label>
						<InputGroup.Root>
							<InputGroup.Input {...props} bind:value={$formData.name} />
						</InputGroup.Root>
					{/snippet}
				</Form.Control>

				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="currency">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Währung</Form.Label>
						<Select.Root type="single" name={props.name} bind:value={$formData.currency}>
							<Select.Trigger class="font-semibold" {...props}>
								{$formData.currency}
							</Select.Trigger>
							<Select.Content>
								<Select.Group>
									<Select.Label>Verfügbare Währungen</Select.Label>
									{#each CURRENCIES as currency (currency)}
										<Select.Item value={currency} label={currency} class="font-semibold">
											{currency}
										</Select.Item>
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>
					{/snippet}
				</Form.Control>

				<Form.FieldErrors />
			</Form.Field>
		</form>

		<Dialog.Footer class="mt-6">
			<Dialog.Close class={buttonVariants({ variant: 'ghost' })}>{m.dialog_close()}</Dialog.Close>
			<Button type="submit" form={$formId}>{m.save()}</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
