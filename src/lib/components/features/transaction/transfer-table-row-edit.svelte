<script lang="ts">
	import type { ListTransaction } from '$lib/server/db/user-context/transaction';
	import type { CURRENCIES } from '$lib/utils/currencies';
	import type { Attachment } from 'svelte/attachments';

	import { Button } from '$lib/components/ui/button';
	import { DatePicker } from '$lib/components/ui/date-picker';
	import { Input } from '$lib/components/ui/input';
	import { InputMoney } from '$lib/components/ui/input-money';
	import { SelectCategory } from '$lib/components/ui/select-category';
	import { m } from '$lib/paraglide/messages';
	import { getAccounts } from '$lib/remote-functions/account.remote';
	import {
		batchDeleteTransactions,
		editTransfer,
		listTransactions
	} from '$lib/remote-functions/transaction.remote';
	import { clickOutside } from '$lib/utils/click-outside';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';
	import { parseDate } from '@internationalized/date';
	import { cn } from 'tailwind-variants';
	import TrashIcon from '~icons/ph/trash';

	import { colsClass } from './transaction-table-cols';
	import RowErrors from './transaction-table-row-errors.svelte';

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
	const form = editTransfer.for(id);
	const deleteForm = batchDeleteTransactions.for(id);
	const deleteFormId = `dform-${id}`;

	const accounts = $derived(await getAccounts(budgetId));
	const counterpartAccounts = $derived(
		accounts.filter((account) => account.id !== transaction.accountId)
	);

	// Row-scoped micro-form (ADR-0009): thrown errors go to the anchored toast,
	// validation issues to the shared row error line below the fields.
	const submit = createFormSubmit(() => form, {
		onSuccess: () => cancelEditing(),
		toast: {},
		updates: () => [listTransactions]
	});

	// Deleting either leg removes the whole transfer server-side (ADR-0015); the
	// refreshed list unmounts this row — that is the success signal.
	const deleteSubmit = createFormSubmit(() => deleteForm, { toast: {} });

	const pending = $derived(submit.pending || deleteSubmit.pending);

	// Seed the two fields whose inputs bind to field state instead of an
	// `as(...)` default.
	const initFieldsOnMount: Attachment<HTMLFormElement> = () => {
		form.fields.counterpartAccountId.set(transaction.counterpartAccountId ?? '');
		form.fields.amount.set(transaction.amount);
	};
</script>

<form
	{...submit.attrs}
	{@attach submit.anchor}
	{@attach initFieldsOnMount}
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
	<input {...form.fields.transferId.as('hidden', transaction.transferId ?? '')} />

	<div role="cell" class="grid items-center bg-interactive/5 p-2">
		<SelectCategory
			name={form.fields.counterpartAccountId.as('select').name}
			bind:value={
				() => form.fields.counterpartAccountId.value() ?? '',
				(v) => form.fields.counterpartAccountId.set(v)
			}
			categories={counterpartAccounts}
			ariaInvalid={form.fields.counterpartAccountId.issues()?.length ? true : undefined}
			ariaLabel={m.transfer_counterpart_account_label()}
			ariaLabelTrigger={m.select_account_open()}
			placeholder={m.select_account_placeholder()}
			textNotFound={m.select_account_not_found()}
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

	<div role="cell" class="grid place-content-center bg-interactive/5 p-2"></div>

	<RowErrors issues={form.fields.allIssues()} />

	<div
		role="cell"
		class="col-span-full flex items-center justify-between gap-2 bg-interactive/5 p-2"
	>
		<p class="px-1 text-sm text-muted">{m.transfer_amount_hint()}</p>

		<div class="flex items-center gap-2">
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
	</div>
</form>

<form id={deleteFormId} class="hidden" {...deleteSubmit.attrs}></form>
