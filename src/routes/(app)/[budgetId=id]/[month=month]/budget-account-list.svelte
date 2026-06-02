<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { InputCurrency } from '$lib/components/ui/input-currency';
	import { m } from '$lib/paraglide/messages';
	import { getBudgetContext } from '$lib/utils/budget-context';
	import { formatCurrency } from '$lib/utils/format-currency';
	import { untrack } from 'svelte';
	import { type Infer, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import PiggyBankIcon from '~icons/ph/piggy-bank';
	import PlusIcon from '~icons/ph/plus';

	import { schemaAccountCreate } from '../accounts/new/schema';

	let {
		accounts,
		createAccountForm
	}: {
		accounts: App.Account[];
		createAccountForm: SuperValidated<Infer<typeof schemaAccountCreate>>;
	} = $props();

	const getBudget = getBudgetContext();
	const [budgetId, budgetName] = $derived.by(() => {
		const { id, name } = getBudget();
		return [id, name];
	});
	const currency = $derived(getBudget().currency);

	const form = superForm(
		untrack(() => createAccountForm),
		{
			onUpdated: (event) => {
				if (event.form.message?.type === 'success') {
					openCreateAccountForm = false;
					const accountId = event.form.message.text;
					if (accountId) {
						goto(resolve('/(app)/[budgetId=id]/accounts/[accountId=id]', { accountId, budgetId }));
					}
				}
			},
			validators: zod4Client(schemaAccountCreate)
		}
	);

	const { enhance, form: formData, formId } = form;

	let openCreateAccountForm = $state(false);
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="icon-lg" class="bg-muted/10 hover:bg-muted/20">
				<PiggyBankIcon class="size-5" />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>

	<DropdownMenu.Content align="end" class="w-fit [--radius:1rem]">
		<DropdownMenu.Group>
			<DropdownMenu.Label>{m.budget_account_list_accounts_label({ budgetName })}</DropdownMenu.Label>

			{#each accounts as account (account.id)}
				<DropdownMenu.Item>
					{#snippet child({ props })}
						<a
							href={resolve('/(app)/[budgetId=id]/accounts/[accountId=id]', {
								accountId: account.id,
								budgetId
							})}
							class="flex w-full justify-between gap-6"
							{...props}
						>
							<span>{account.name}</span>

							<span class="font-currency">
								{formatCurrency({ centValue: account.balance, currency })}
							</span>
						</a>
					{/snippet}
				</DropdownMenu.Item>
			{/each}
		</DropdownMenu.Group>

		<DropdownMenu.Separator />

		<DropdownMenu.Group>
			<DropdownMenu.Item
				variant="interactive"
				class="justify-center"
				onSelect={() => (openCreateAccountForm = true)}
			>
				<PlusIcon />
				{m.budget_account_list_add_account()}
			</DropdownMenu.Item>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>

<Dialog.Root bind:open={openCreateAccountForm}>
	<Dialog.Content class="max-w-lg gap-6">
		<Dialog.Header>
			<Dialog.Title>{m.budget_account_list_dialog_title()}</Dialog.Title>
			<Dialog.Description class="grid gap-4">
				<p>{m.budget_account_list_dialog_description({ budgetName })}</p>
			</Dialog.Description>
		</Dialog.Header>

		<form
			id={$formId}
			class="grid gap-2 rounded-lg bg-muted/5 p-3"
			action={resolve('/(app)/[budgetId=id]/accounts/new', { budgetId })}
			use:enhance
			method="POST"
		>
			<Form.Field {form} name="accountName">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{m.account_placeholder_name()}</Form.Label>
						<Input {...props} bind:value={$formData.accountName} />
					{/snippet}
				</Form.Control>

				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="startingBalance">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>{m.account_starting_balance_label()}</Form.Label>
						<InputCurrency
							{...props}
							class="text-right"
							placeholder={formatCurrency({ centValue: 0, currency })}
							{currency}
							bind:value={$formData.startingBalance}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</form>

		<Dialog.Footer>
			<Dialog.Close class={buttonVariants({ variant: 'ghost' })}>{m.dialog_close()}</Dialog.Close>
			<Button type="submit" form={$formId}>{m.account_create_button()}</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
