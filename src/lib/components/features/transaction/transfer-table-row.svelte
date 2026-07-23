<script lang="ts">
	import type { ListTransaction } from '$lib/server/db/user-context/transaction';
	import type { CURRENCIES } from '$lib/utils/currencies';

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
	import { formatTransactionDate } from '$lib/utils/format-transaction-date';
	import { asMoney, formatMoney } from '$lib/utils/money';
	import { parseDate } from '@internationalized/date';
	import { tick, untrack } from 'svelte';
	import { slide } from 'svelte/transition';
	import { cn } from 'tailwind-variants';
	import TrashIcon from '~icons/ph/trash';

	import {
		cellClass,
		cellTriggerClass,
		colsClass,
		editInputClass,
		editRowClass,
		editSelectClass
	} from './transaction-table-cols';
	import RowErrors from './transaction-table-row-errors.svelte';
	import ValidateToggle from './transaction-validate-toggle.svelte';
	import TransferBadge from './transfer-badge.svelte';

	let {
		budgetId,
		cancelEditing,
		currency,
		isEditing,
		setEditing,
		transaction
	}: {
		budgetId: string;
		cancelEditing: () => void;
		currency: (typeof CURRENCIES)[number];
		isEditing: boolean;
		setEditing: () => void;
		transaction: ListTransaction;
	} = $props();

	type EditableField = 'amount' | 'counterpart' | 'date' | 'notes';

	const id = $props.id();
	const form = editTransfer.for(id);
	const deleteForm = batchDeleteTransactions.for(id);
	// Same one-row-two-modes structure as transaction-table-row.svelte: the
	// row stays a <div> (the read-mode ValidateToggle owns its own <form>),
	// the edit form is a hidden sibling and the controls associate via the
	// `form` attribute.
	const editFormId = `eform-${id}`;
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
	const deleteSubmit = createFormSubmit(() => deleteForm, {
		toast: {},
		updates: () => [listTransactions]
	});

	const pending = $derived(submit.pending || deleteSubmit.pending);

	let counterpartInputRef = $state<HTMLInputElement | null>(null);
	let notesRef = $state<HTMLInputElement | null>(null);
	let dateRef = $state<HTMLButtonElement | null>(null);
	let dateOpen = $state(false);
	let amountRef = $state<HTMLInputElement | null>(null);

	// Which cell was clicked to enter edit mode; consumed by the focus effect
	// below. Deliberately non-reactive — the isEditing flip drives the effect.
	let pendingFocus: EditableField | null = null;

	function startEditing(field: EditableField) {
		pendingFocus = field;
		setEditing();
	}

	// Seed the two fields whose inputs bind to field state instead of an
	// `as(...)` default — on every entry into edit mode, untracked so a list
	// refresh mid-edit cannot clobber the user's changes.
	$effect(() => {
		if (!isEditing) return;
		untrack(() => {
			form.fields.counterpartAccountId.set(transaction.counterpartAccountId ?? '');
			form.fields.amount.set(transaction.amount);
		});
	});

	// Focus the input of the clicked cell. Deferred past the flush with tick():
	// the refs bind through child components and are not yet set when this
	// effect first runs. Text inputs also select; the date cell opens its
	// picker popover (which moves focus into the calendar), and the amount
	// input selects itself via selectOnFocus (its value swap is deferred
	// past focus).
	$effect(() => {
		if (!isEditing || pendingFocus === null) return;
		const field = pendingFocus;
		pendingFocus = null;
		tick().then(() => {
			if (field === 'counterpart') {
				counterpartInputRef?.focus();
				counterpartInputRef?.select();
			} else if (field === 'notes') {
				notesRef?.focus();
				notesRef?.select();
			} else if (field === 'date') {
				dateOpen = true;
			} else {
				amountRef?.focus();
			}
		});
	});

	// The last visible row's cell hairline would double the frame's bottom
	// border — except while editing, where it separates fields from actions.
	const cell = $derived(cn(cellClass, !isEditing && 'group-last-of-type/row:border-b-0'));
</script>

<!-- The keydown only listens for Escape bubbling out of the edit inputs;
     the row itself is never a focus target. -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<div
	role="row"
	class={cn('group/row grid', colsClass, isEditing ? editRowClass : 'hover:bg-muted/3')}
	{@attach isEditing && submit.anchor}
	{@attach isEditing && clickOutside({ callback: cancelEditing })}
	onkeydown={(e) => {
		if (isEditing && e.key === 'Escape') {
			e.stopPropagation();
			cancelEditing();
		}
	}}
>
	<div role="cell" class={cell}>
		{#if isEditing}
			<SelectCategory
				class={cn(editInputClass, editSelectClass)}
				form={editFormId}
				bind:inputRef={counterpartInputRef}
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
		{:else}
			<button
				type="button"
				class={cellTriggerClass}
				aria-label={m.transactions_table_edit_category()}
				onclick={() => startEditing('counterpart')}
			>
				<TransferBadge {transaction} class="px-1 py-0 text-sm" />
			</button>
		{/if}
	</div>

	<div role="cell" class={cell}>
		{#if isEditing}
			<Input
				class={cn(editInputClass, 'text-sm')}
				form={editFormId}
				bind:ref={notesRef}
				aria-label={m.transactions_table_header_notes()}
				{...form.fields.notes.as('text', transaction.notes ?? '')}
			/>
		{:else}
			<button
				type="button"
				class={cn(cellTriggerClass, 'text-sm')}
				aria-label={m.transactions_table_edit_notes()}
				onclick={() => startEditing('notes')}
			>
				{transaction.notes ?? ''}
			</button>
		{/if}
	</div>

	<div role="cell" class={cell}>
		{#if isEditing}
			<DatePicker
				form={editFormId}
				bind:ref={dateRef}
				bind:open={dateOpen}
				name={form.fields.date.as('date').name}
				bind:value={
					() => parseDate(form.fields.date.value() ?? transaction.date),
					(v) => form.fields.date.set(v.toString())
				}
				ariaInvalid={form.fields.date.issues()?.length ? true : undefined}
				class={cn(editInputClass, 'justify-end')}
				label={m.transaction_table_cell_date_select()}
			/>
		{:else}
			<button
				type="button"
				class={cn(cellTriggerClass, 'justify-end')}
				aria-label={m.transactions_table_edit_date()}
				onclick={() => startEditing('date')}
			>
				{formatTransactionDate(parseDate(transaction.date))}
			</button>
		{/if}
	</div>

	<div role="cell" class={cell}>
		{#if isEditing}
			<InputMoney
				form={editFormId}
				bind:ref={amountRef}
				selectOnFocus
				name={form.fields.amount.as('number').name}
				aria-label={m.transactions_table_header_amount()}
				bind:value={() => form.fields.amount.value(), (v) => form.fields.amount.set(v)}
				{currency}
				class={cn(editInputClass, 'text-right font-currency')}
			/>
		{:else}
			<button
				type="button"
				class={cn(cellTriggerClass, 'justify-end font-currency')}
				aria-label={m.transactions_table_edit_amount()}
				onclick={() => startEditing('amount')}
			>
				{formatMoney({ currency, money: asMoney(transaction.amount) })}
			</button>
		{/if}
	</div>

	<!-- Validation is per-leg and display-mode only; in edit mode the cell
	     stays as an empty spacer so the columns hold. Right-aligned like the
	     column header. -->
	<div role="cell" class={cell}>
		{#if !isEditing}
			<ValidateToggle {transaction} class="mr-1 ml-auto" />
		{/if}
	</div>

	{#if isEditing}
		<RowErrors issues={form.fields.allIssues()} />

		<div
			role="cell"
			transition:slide={{ duration: 150 }}
			class="col-span-full flex items-center justify-between gap-1 p-1"
		>
			<p class="px-1 text-sm text-muted">{m.transfer_amount_hint()}</p>

			<div class="flex items-center gap-1">
				<Button type="button" size="xs" variant="ghost" disabled={pending} onclick={cancelEditing}>
					{m.cancel()}
				</Button>

				<Button
					type="submit"
					variant="destructive"
					size="icon-xs"
					form={deleteFormId}
					name={deleteForm.fields.ids.as('select multiple').name}
					value={[transaction.id]}
					disabled={pending}
					{@attach deleteSubmit.anchor}
				>
					<TrashIcon />
					<span class="sr-only">{m.delete()}</span>
				</Button>

				<Button type="submit" size="xs" form={editFormId} disabled={pending}>
					{m.save()}
				</Button>
			</div>
		</div>
	{/if}
</div>

{#if isEditing}
	<form id={editFormId} class="hidden" {...submit.attrs}>
		<input {...form.fields.accountId.as('hidden', transaction.accountId)} />
		<input {...form.fields.transferId.as('hidden', transaction.transferId ?? '')} />
	</form>
	<form id={deleteFormId} class="hidden" {...deleteSubmit.attrs}></form>
{/if}
