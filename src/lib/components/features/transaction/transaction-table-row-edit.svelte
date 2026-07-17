<script lang="ts">
	import type { ListTransaction } from '$lib/server/db/user-context/transaction';
	import type { CURRENCIES } from '$lib/utils/currencies';

	import { Button } from '$lib/components/ui/button';
	import { DatePicker } from '$lib/components/ui/date-picker';
	import { Input } from '$lib/components/ui/input';
	import { InputMoney } from '$lib/components/ui/input-money';
	import { SelectCategory } from '$lib/components/ui/select-category';
	import { m } from '$lib/paraglide/messages';
	import { getCategories } from '$lib/remote-functions/category.remote';
	import {
		batchDeleteTransactions,
		editTransaction,
		listTransactions
	} from '$lib/remote-functions/transaction.remote';
	import { clickOutside } from '$lib/utils/click-outside';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';
	import { parseDate } from '@internationalized/date';
	import { onMount } from 'svelte';
	import { cn } from 'tailwind-variants';
	import TrashIcon from '~icons/ph/trash';

	import { colsClass } from './transaction-table-cols';
	import RowErrors from './transaction-table-row-errors.svelte';
	import ValidationCheckbox from './transaction-validation-checkbox.svelte';

	let {
		budgetId,
		cancelEditing,
		currency,
		transaction
	}: {
		budgetId: string;
		cancelEditing: () => void;
		currency: (typeof CURRENCIES)[number];
		transaction: ListTransaction;
	} = $props();

	const id = $props.id();
	const form = editTransaction.for(id);
	const deleteForm = batchDeleteTransactions.for(id);
	const deleteFormId = `dform-${id}`;

	const categories = $derived(await getCategories({ budgetId }));

	// Row-scoped micro-form (ADR-0009): thrown errors go to the anchored toast,
	// validation issues to the shared row error line below the fields.
	const submit = createFormSubmit(() => form, {
		onSuccess: () => cancelEditing(),
		toast: {},
		updates: () => [listTransactions]
	});

	// No onSuccess: the refreshed list unmounts this row — that is the
	// success signal.
	const deleteSubmit = createFormSubmit(() => deleteForm, {
		toast: {},
		updates: () => [listTransactions]
	});

	const pending = $derived(submit.pending || deleteSubmit.pending);

	onMount(() => {
		form.fields.categoryId.set(transaction.categoryId ?? undefined);
		form.fields.amount.set(transaction.amount);
	});
</script>

<form
	{...submit.attrs}
	{@attach submit.anchor}
	role="row"
	class={cn(
		colsClass,
		'grid rounded-sm border border-interactive/30 bg-surface shadow shadow-interactive/15'
	)}
	{@attach clickOutside({ callback: cancelEditing })}
	onkeydown={(e) => {
		if (e.key === 'Escape') {
			e.stopPropagation();
			cancelEditing();
		}
	}}
>
	<input {...form.fields.accountId.as('hidden', transaction.accountId)} />
	<input {...form.fields.transactionId.as('hidden', transaction.id)} />

	<div role="cell" class="grid items-center bg-interactive/5 p-2">
		<SelectCategory
			name={form.fields.categoryId.as('select').name}
			bind:value={() => form.fields.categoryId.value() ?? '', (v) => form.fields.categoryId.set(v)}
			{categories}
			nullable
			ariaInvalid={form.fields.categoryId.issues()?.length ? true : undefined}
			ariaLabel={m.transactions_table_header_category()}
			ariaLabelTrigger={m.select_category_open()}
		/>
	</div>

	<div role="cell" class="grid items-center bg-interactive/5 p-2">
		<Input
			class="px-2"
			aria-label={m.transactions_table_header_notes()}
			{...form.fields.notes.as('text', transaction.notes ?? '')}
		/>
	</div>

	<div role="cell" class="grid items-center bg-interactive/5 p-2">
		<DatePicker
			name={form.fields.date.as('date').name}
			bind:value={
				() => parseDate(form.fields.date.value() ?? transaction.date),
				(v) => form.fields.date.set(v.toString())
			}
			ariaInvalid={form.fields.date.issues()?.length ? true : undefined}
			class="justify-end"
			label={m.transaction_table_cell_date_select()}
		/>
	</div>

	<div role="cell" class="grid items-center bg-interactive/5 p-2">
		<InputMoney
			name={form.fields.amount.as('number').name}
			aria-label={m.transactions_table_header_amount()}
			bind:value={() => form.fields.amount.value(), (v) => form.fields.amount.set(v)}
			{currency}
			class="px-2 text-right font-currency font-normal"
		/>
	</div>

	<div role="cell" class="grid place-content-center bg-interactive/5 p-2">
		<ValidationCheckbox {...form.fields.validated.as('checkbox', transaction.validated)} />
	</div>

	<RowErrors issues={form.fields.allIssues()} />

	<div role="cell" class="col-span-full flex items-center justify-end gap-2 bg-interactive/5 p-2">
		<Button type="button" variant="ghost" disabled={pending} onclick={cancelEditing}>
			{m.cancel()}
		</Button>

		<Button
			type="submit"
			variant="destructive"
			size="icon"
			form={deleteFormId}
			name={deleteForm.fields.ids.as('select multiple').name}
			value={[transaction.id]}
			disabled={pending}
			{@attach deleteSubmit.anchor}
		>
			<TrashIcon />
			<span class="sr-only">{m.delete()}</span>
		</Button>

		<Button type="submit" disabled={pending}>
			{m.save()}
		</Button>
	</div>
</form>

<form id={deleteFormId} class="hidden" {...deleteSubmit.attrs}></form>
