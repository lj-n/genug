<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { createAccount } from '$lib/remote-functions/account.remote';
	import { getBudget } from '$lib/remote-functions/budget.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';

	import { Button } from '../../ui/button';
	import { FormBody } from '../../ui/form-body';
	import { FormField } from '../../ui/form-field';
	import { Input } from '../../ui/input';
	import { InputMoney } from '../../ui/input-money';

	const budgetId = getBudgetId();

	const budget = $derived(await getBudget(budgetId()));
	const form = $derived(createAccount.for(budgetId()));

	// Create-then-navigate: the redirect is the success signal, no toast.
	const submit = createFormSubmit(() => form, { toast: {} });
</script>

<FormBody {...submit.attrs}>
	<input {...form.fields.budgetId.as('hidden', budgetId())} />

	<FormField field={form.fields.accountName} label={m.account_label_name()}>
		{#snippet input(field)}
			<Input {...field.as('text')} placeholder={m.account_placeholder_name()} />
		{/snippet}
	</FormField>

	<FormField field={form.fields.startingBalance} label={m.account_starting_balance_label()}>
		{#snippet input(field)}
			<InputMoney
				name={field.as('number').name}
				bind:value={() => field.value(), (v) => field.set(v)}
				currency={budget.currency}
				aria-invalid={field.issues()?.length ? true : undefined}
			/>
		{/snippet}
	</FormField>

	<Button type="submit" class="ml-auto" loading={submit.pending} {@attach submit.anchor}>
		{m.account_create_button()}
	</Button>
</FormBody>
