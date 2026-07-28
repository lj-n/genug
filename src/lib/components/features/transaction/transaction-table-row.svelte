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
	import { formatTransactionDate } from '$lib/utils/format-transaction-date';
	import { asMoney, formatMoney } from '$lib/utils/money';
	import { parseDate } from '@internationalized/date';
	import { tick, untrack } from 'svelte';
	import { slide } from 'svelte/transition';
	import { cn } from 'tailwind-variants';
	import EmptyIcon from '~icons/ph/empty';
	import TrashIcon from '~icons/ph/trash';

	import {
		cellClass,
		cellTriggerClass,
		colsClass,
		editInputClass,
		editRowClass,
		editSelectClass,
		footerButtonTouchClass
	} from './transaction-table-cols';
	import RowErrors from './transaction-table-row-errors.svelte';
	import ValidateToggle from './transaction-validate-toggle.svelte';
	import ValidationCheckbox from './transaction-validation-checkbox.svelte';

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

	type EditableField = 'amount' | 'category' | 'date' | 'notes';

	const id = $props.id();
	const form = editTransaction.for(id);
	const deleteForm = batchDeleteTransactions.for(id);
	// The row stays a <div> because the read-mode ValidateToggle owns its own
	// <form>; the edit and delete forms are hidden siblings and their controls
	// associate via the `form` attribute.
	const editFormId = `eform-${id}`;
	const deleteFormId = `dform-${id}`;

	const categories = $derived(await getCategories({ budgetId }));

	// Row-scoped micro-form (ADR-0009): thrown errors go to the anchored toast,
	// validation issues to the shared row error line below the fields.
	const submit = createFormSubmit(() => form, {
		onSuccess: () => cancelEditing(),
		toast: {},
		updates: () => [listTransactions]
	});

	// No onSuccess: the refreshed list unmounting this row is the success signal.
	const deleteSubmit = createFormSubmit(() => deleteForm, {
		toast: {},
		updates: () => [listTransactions]
	});

	const pending = $derived(submit.pending || deleteSubmit.pending);

	let categoryInputRef = $state<HTMLInputElement | null>(null);
	let notesRef = $state<HTMLInputElement | null>(null);
	let dateRef = $state<HTMLButtonElement | null>(null);
	let dateOpen = $state(false);
	let amountRef = $state<HTMLInputElement | null>(null);

	// Deliberately non-reactive — the isEditing flip drives the focus effect.
	let pendingFocus: EditableField | null = null;

	function startEditing(field: EditableField) {
		pendingFocus = field;
		setEditing();
	}

	// Seed the fields that bind to field state instead of an `as(...)` default;
	// untracked so a list refresh mid-edit cannot clobber the user's changes.
	$effect(() => {
		if (!isEditing) return;
		untrack(() => {
			form.fields.categoryId.set(transaction.categoryId ?? undefined);
			form.fields.amount.set(transaction.amount);
		});
	});

	// tick(): the refs bind through child components and are not yet set when
	// this effect first runs.
	$effect(() => {
		if (!isEditing || pendingFocus === null) return;
		const field = pendingFocus;
		pendingFocus = null;
		tick().then(() => {
			if (field === 'category') {
				categoryInputRef?.focus();
				categoryInputRef?.select();
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

<!-- The keydown only catches Escape bubbling out of the edit inputs; the row
     itself is never a focus target. -->
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
				bind:inputRef={categoryInputRef}
				name={form.fields.categoryId.as('select').name}
				bind:value={
					() => form.fields.categoryId.value() ?? '', (v) => form.fields.categoryId.set(v)
				}
				{categories}
				nullable
				ariaInvalid={form.fields.categoryId.issues()?.length ? true : undefined}
				ariaLabel={m.transactions_table_header_category()}
				ariaLabelTrigger={m.select_category_open()}
			/>
		{:else}
			<button
				type="button"
				class={cellTriggerClass}
				aria-label={m.transactions_table_edit_category()}
				onclick={() => startEditing('category')}
			>
				{#if transaction.categoryName}
					{transaction.categoryName}
				{:else}
					<span
						class="inline-flex max-w-full min-w-0 items-center gap-1 rounded-sm bg-muted/10 px-1 py-0 text-sm text-muted"
					>
						<EmptyIcon class="size-3.5 shrink-0" aria-hidden="true" />
						<span class="truncate">{m.transaction_table_cell_category_empty()}</span>
					</span>
				{/if}
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

	<!-- Right-aligned like the column header; mr-1/pr-1 puts the size-6 icon
	     inside its size-8 hit area at the same px-2 inset as the header seal. -->
	<div role="cell" class={cn(cell, isEditing && 'items-center justify-end pr-1')}>
		{#if isEditing}
			<ValidationCheckbox
				labelClass="size-8"
				form={editFormId}
				{...form.fields.validated.as('checkbox', transaction.validated)}
			/>
		{:else}
			<ValidateToggle {transaction} class="mr-1 ml-auto" />
		{/if}
	</div>

	{#if isEditing}
		<RowErrors issues={form.fields.allIssues()} />

		<div
			role="cell"
			transition:slide={{ duration: 150 }}
			class="col-span-full flex items-center justify-end gap-1 p-1"
		>
			<Button
				type="button"
				size="xs"
				class={footerButtonTouchClass}
				variant="ghost"
				disabled={pending}
				onclick={cancelEditing}
			>
				{m.cancel()}
			</Button>

			<Button
				type="submit"
				variant="destructive"
				size="icon-xs"
				class="@3xl/main:size-11 @7xl/main:size-6"
				form={deleteFormId}
				name={deleteForm.fields.ids.as('select multiple').name}
				value={[transaction.id]}
				disabled={pending}
				{@attach deleteSubmit.anchor}
			>
				<TrashIcon />
				<span class="sr-only">{m.delete()}</span>
			</Button>

			<Button
				type="submit"
				size="xs"
				class={footerButtonTouchClass}
				form={editFormId}
				disabled={pending}
			>
				{m.save()}
			</Button>
		</div>
	{/if}
</div>

{#if isEditing}
	<form id={editFormId} class="hidden" {...submit.attrs}>
		<input {...form.fields.accountId.as('hidden', transaction.accountId)} />
		<input {...form.fields.transactionId.as('hidden', transaction.id)} />
	</form>
	<form id={deleteFormId} class="hidden" {...deleteSubmit.attrs}></form>
{/if}
