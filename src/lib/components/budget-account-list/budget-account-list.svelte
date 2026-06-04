<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Input } from '$lib/components/ui/input';
	import { InputCurrency } from '$lib/components/ui/input-currency';
	import { Label } from '$lib/components/ui/label';
	import { m } from '$lib/paraglide/messages';
	import { createAccount, getAccounts } from '$lib/remote-functions/account.remote';
	import { getBudget } from '$lib/remote-functions/budget.remote';
	import { formatCurrency } from '$lib/utils/format-currency';
	import PiggyBankIcon from '~icons/ph/piggy-bank';
	import PlusIcon from '~icons/ph/plus';

	let { budgetId }: { budgetId: string } = $props();

	const accounts = $derived(await getAccounts({ budgetId }));
	const budget = $derived(await getBudget({ budgetId }));

	let open = $state(false);
	const formId = $props.id();
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
			<DropdownMenu.Label>
				{m.budget_account_list_accounts_label({ budgetName: budget.name })}
			</DropdownMenu.Label>

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
								{formatCurrency({ centValue: account.balance, currency: budget.currency })}
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
				onSelect={() => (open = true)}
			>
				<PlusIcon />
				{m.budget_account_list_add_account()}
			</DropdownMenu.Item>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-lg gap-6">
		<Dialog.Header>
			<Dialog.Title>{m.budget_account_list_dialog_title()}</Dialog.Title>
			<Dialog.Description class="grid gap-4">
				<p>{m.budget_account_list_dialog_description({ budgetName: budget.name })}</p>
			</Dialog.Description>
		</Dialog.Header>

		<form
			{...createAccount.enhance(async (form) => {
				if (await form.submit()) {
					open = false;
				}
			})}
			id={formId}
			class="grid gap-2 rounded-lg bg-muted/5 p-3"
		>
			<input {...createAccount.fields.budgetId.as('hidden', budgetId)} />

			<div class="grid gap-2">
				<Label>{m.account_placeholder_name()}</Label>
				<Input {...createAccount.fields.accountName.as('text')} />
			</div>

			<div class="grid gap-2">
				<Label>{m.account_starting_balance_label()}</Label>
				<InputCurrency
					name={createAccount.fields.startingBalance.as('number').name}
					bind:value={
						() => createAccount.fields.startingBalance.value() ?? 0,
						(v) => createAccount.fields.startingBalance.set(v)
					}
					class="text-right"
					currency={budget.currency}
					placeholder={formatCurrency({ centValue: 0, currency: budget.currency })}
				/>
			</div>
		</form>

		<Dialog.Footer>
			<Dialog.Close class={buttonVariants({ variant: 'ghost' })}>{m.dialog_close()}</Dialog.Close>
			<Button type="submit" form={formId}>{m.account_create_button()}</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
