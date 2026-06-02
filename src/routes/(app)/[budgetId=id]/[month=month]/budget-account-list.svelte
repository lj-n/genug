<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { InputCurrency } from '$lib/components/ui/input-currency';
	import * as Popover from '$lib/components/ui/popover';
	import { m } from '$lib/paraglide/messages';
	import { getBudgetContext } from '$lib/utils/budget-context';
	import { formatCurrency } from '$lib/utils/format-currency';
	import { untrack } from 'svelte';
	import { type Infer, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import PhPiggyBankDuoTone from '~icons/ph/piggy-bank-duotone';
	import PhPlus from '~icons/ph/plus';

	import { schemaAccountCreate } from '../accounts/new/schema';

	let {
		accounts,
		createAccountForm
	}: {
		accounts: App.Account[];
		createAccountForm: SuperValidated<Infer<typeof schemaAccountCreate>>;
	} = $props();

	const getBudget = getBudgetContext();
	const budgetId = $derived(getBudget().id);
	const currency = $derived(getBudget().currency);

	const form = superForm(
		untrack(() => createAccountForm),
		{
			onUpdated: (event) => {
				if (event.form.message?.type === 'success') {
					openCreateAccountForm = false;
				}
			},
			validators: zod4Client(schemaAccountCreate)
		}
	);

	const { enhance, form: formData } = form;

	let openCreateAccountForm = $state(false);
</script>

<div class="relative grid gap-2 rounded-xl bg-muted/5 p-3">
	<Popover.Root bind:open={openCreateAccountForm}>
		<Popover.Trigger>
			{#snippet child({ props })}
				<Button {...props} size="sm" class="w-fit">
					<PhPlus />
					{m.account_create_button()}
				</Button>
			{/snippet}
		</Popover.Trigger>

		<Popover.Content align="start" class="flex flex-col gap-2" sideOffset={-30}>
			<form
				class="contents"
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

				<Form.Button>{m.account_create_button()}</Form.Button>
			</form>
		</Popover.Content>
	</Popover.Root>

	<ul class="flex w-fit items-center gap-2">
		{#each accounts as account (account.id)}
			<li class="">
				<a
					href={resolve('/(app)/[budgetId=id]/accounts/[accountId=id]', {
						accountId: account.id,
						budgetId: account.budgetId
					})}
					class="flex flex-col items-start justify-center rounded-lg border border-muted/10 bg-background px-2 py-1 shadow-xs hover:bg-muted/3"
				>
					<div class="">{account.name}</div>
					<div class="flex items-center gap-2 text-sm">
						<PhPiggyBankDuoTone class="text-muted" />
						<span class="font-currency">
							{formatCurrency({ centValue: account.balance, currency })}
						</span>
					</div>
				</a>
			</li>
		{/each}
	</ul>
</div>
