<script lang="ts">
	import { page } from '$app/state';
	import { Input } from '$lib/components/ui/input';
	import { InputCurrency } from '$lib/components/ui/input-currency';
	import * as Page from '$lib/components/ui/page';
	import { m } from '$lib/paraglide/messages';
	import { createAccount } from '$lib/remote-functions/account.remote';
	import { getBudget } from '$lib/remote-functions/budget.remote';
	import PhPiggyBankDuotone from '~icons/ph/piggy-bank-duotone';

	const budgetId = $derived(page.params.budgetId!);
	const budget = $derived(await getBudget({ budgetId }));
	const currency = $derived(budget.currency);
</script>

<Page.Root class="max-w-lg">
	<Page.Header>
		<Page.Title>
			{m.new_account_title()}
		</Page.Title>

		<Page.Description>
			<PhPiggyBankDuotone class="mr-2 inline size-8 align-bottom" />
			{m.new_account_description()}
		</Page.Description>
	</Page.Header>

	<Page.Content>
		<form {...createAccount} class="grid gap-2 rounded-md border border-muted/20 bg-surface p-2">
			<input {...createAccount.fields.budgetId.as('hidden', budgetId)} />

			<Input
				{...createAccount.fields.accountName.as('text')}
				placeholder={m.account_placeholder_name()}
				aria-label={m.account_label_name()}
			/>

			<InputCurrency
				name={createAccount.fields.startingBalance.as('number').name}
				bind:value={
					() => createAccount.fields.startingBalance.value() ?? 0,
					(v) => createAccount.fields.startingBalance.set(v)
				}
				{currency}
				aria-label={m.account_create_starting_balance()}
			/>

			<button type="submit" class="btn ml-auto">
				{m.account_create_button()}
			</button>
		</form>
	</Page.Content>
</Page.Root>
