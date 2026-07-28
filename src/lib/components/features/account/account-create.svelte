<script lang="ts">
	import type { CURRENCIES } from '$lib/utils/currencies';
	import type { RemoteQueryUpdate } from '@sveltejs/kit';

	import { m } from '$lib/paraglide/messages';
	import {
		createAccount,
		createAccountInline,
		getAccounts
	} from '$lib/remote-functions/account.remote';
	import { getBudgetId } from '$lib/utils/budget-id-context';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';

	import { Button } from '../../ui/button';
	import { FormBody } from '../../ui/form-body';
	import { FormField } from '../../ui/form-field';
	import { Input } from '../../ui/input';
	import { InputMoney } from '../../ui/input-money';

	// `currency` is a prop instead of an awaited query: this form first mounts
	// when its dialog opens, and a top-level await would suspend the dialog
	// subtree past bits-ui's open autofocus — focus would stay on the trigger
	// behind the overlay. Callers resolve the budget at page mount instead.
	//
	// With `onSuccess` the form creates in place (no redirect): the callback is
	// the close signal and the account list refreshes single-flight, plus any
	// caller-declared `updates`. Without it, the redirect is the success signal.
	let {
		class: className,
		currency,
		onSuccess,
		updates
	}: {
		class?: string;
		currency: (typeof CURRENCIES)[number];
		onSuccess?: () => void;
		updates?: () => RemoteQueryUpdate[];
	} = $props();

	const budgetId = getBudgetId();

	const form = $derived(
		onSuccess ? createAccountInline.for(budgetId()) : createAccount.for(budgetId())
	);

	// The mode (inline vs redirect) is fixed per call site — no caller ever
	// swaps `onSuccess` after mount, so capturing its presence at init is
	// deliberate.
	// svelte-ignore state_referenced_locally
	const submit = createFormSubmit(() => form, {
		onSuccess: onSuccess
			? (instance) => {
					instance.element.reset();
					onSuccess();
				}
			: undefined,
		toast: {},
		updates: onSuccess ? () => [getAccounts(budgetId()), ...(updates?.() ?? [])] : undefined
	});
</script>

<FormBody {...submit.attrs} class={className}>
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
				{currency}
				aria-invalid={field.issues()?.length ? true : undefined}
			/>
		{/snippet}
	</FormField>

	<Button type="submit" class="ml-auto" loading={submit.pending} {@attach submit.anchor}>
		{m.account_create_button()}
	</Button>
</FormBody>
