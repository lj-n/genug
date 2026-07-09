<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { createAccount } from '$lib/remote-functions/account.remote';
	import { getBudget } from '$lib/remote-functions/budget.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';

	import { Button } from '../../ui/button';
	import { FormBody } from '../../ui/form-body';
	import { FormField } from '../../ui/form-field';
	import { Input } from '../../ui/input';
	import { InputCurrency } from '../../ui/input-currency';

	const budgetId = getBudgetId();

	const budgetQuery = $derived(getBudget(budgetId()));
	const form = $derived(createAccount.for(budgetId()));
</script>

<FormBody {...form}>
	<input {...form.fields.budgetId.as('hidden', budgetId())} />

	<FormField field={form.fields.accountName} label={m.account_label_name()}>
		{#snippet input(field)}
			<Input {...field.as('text')} placeholder={m.account_placeholder_name()} />
		{/snippet}
	</FormField>

	<FormField field={form.fields.startingBalance} label={m.account_starting_balance_label()}>
		{#snippet input(field)}
			<InputCurrency
				name={field.as('number').name}
				bind:value={() => field.value() ?? 0, (v) => field.set(v)}
				currency={(await budgetQuery).currency}
				aria-invalid={field.issues()?.length ? true : undefined}
			/>
		{/snippet}
	</FormField>

	<Button type="submit" class="ml-auto">
		{m.account_create_button()}
	</Button>
</FormBody>
