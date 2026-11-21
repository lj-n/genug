<script lang="ts">
	import type { ListTransaction } from '$lib/server/db/user-context/transaction';
	import type { CURRENCIES } from '$lib/utils/currencies';
	import type { Attachment } from 'svelte/attachments';

	import { Button } from '$lib/components/ui/button';
	import { DatePicker } from '$lib/components/ui/date-picker';
	import { Input } from '$lib/components/ui/input';
	import { InputMoney } from '$lib/components/ui/input-money';
	import { Label } from '$lib/components/ui/label';
	import * as ResponsiveModal from '$lib/components/ui/responsive-modal';
	import { SelectCategory } from '$lib/components/ui/select-category';
	import { m } from '$lib/paraglide/messages';
	import { getAccount, getAccountBalances } from '$lib/remote-functions/account.remote';
	import { getCategories } from '$lib/remote-functions/category.remote';
	import { getCheckpointSummary, listTransactions } from '$lib/remote-functions/register.remote';
	import {
		batchDeleteTransactions,
		editTransaction
	} from '$lib/remote-functions/transaction.remote';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';
	import { formatTransactionDate } from '$lib/utils/format-transaction-date';
	import { asMoney, formatMoney } from '$lib/utils/money';
	import { parseDate } from '@internationalized/date';
	import TrashIcon from '~icons/ph/trash';

	import { sealedDate } from './sealed';
	import SealedField from './sealed-field.svelte';
	import SealedNote from './sealed-note.svelte';
	import ValidateToggle from './transaction-validate-toggle.svelte';
	import ValidationCheckbox from './transaction-validation-checkbox.svelte';

	let {
		budgetId,
		currency,
		open = $bindable(false),
		transaction = $bindable()
	}: {
		budgetId: string;
		currency: (typeof CURRENCIES)[number];
		open?: boolean;
		transaction: ListTransaction | null;
	} = $props();

	const categories = $derived(await getCategories({ budgetId }));

	const id = $props.id();

	// Scoped per transaction id, so reopening for another transaction gets a
	// fresh form instance instead of the previous one's field state.
	const form = $derived(transaction === null ? null : editTransaction.for(transaction.id));
	const deleteForm = $derived(
		transaction === null ? null : batchDeleteTransactions.for(transaction.id)
	);
	// The footer buttons live outside the <form> elements (in the pinned
	// Footer, see ADR-0013) and submit via the form attribute.
	const formId = `${id}-edit`;
	const deleteFormId = `${id}-delete`;

	const submit = createFormSubmit(() => form!, {
		onSuccess: () => {
			open = false;
		},
		toast: {},
		updates: () => [
			listTransactions,
			getAccount(transaction!.accountId),
			getAccountBalances(transaction!.accountId),
			getCheckpointSummary(transaction!.accountId)
		]
	});

	// Unlike the inline row (which unmounts on success), the sheet must close
	// itself once the delete lands.
	const deleteSubmit = createFormSubmit(() => deleteForm!, {
		onSuccess: () => {
			open = false;
		},
		toast: {},
		updates: () => [
			listTransactions,
			getAccount(transaction!.accountId),
			getAccountBalances(transaction!.accountId),
			getCheckpointSummary(transaction!.accountId)
		]
	});

	const pending = $derived(submit.pending || deleteSubmit.pending);

	// The form mounts each time the sheet opens; seed the two fields whose
	// inputs bind to field state instead of an `as(...)` default.
	const initFieldsOnMount: Attachment<HTMLFormElement> = () => {
		if (transaction === null || form === null) return;
		form.fields.categoryId.set(transaction.categoryId ?? undefined);
		form.fields.amount.set(transaction.amount);
	};

	// A sealed transaction keeps its account-side facts fixed (ADR-0017).
	const sealed = $derived(transaction?.sealed ?? false);
	const sealedTitle = $derived(
		transaction === null ? '' : m.checkpoint_sealed_title({ date: sealedDate(transaction) })
	);
</script>

<ResponsiveModal.Root bind:open onOpenChangeComplete={(isOpen) => !isOpen && (transaction = null)}>
	<ResponsiveModal.Content>
		{#if transaction !== null && form !== null && deleteForm !== null}
			<ResponsiveModal.Header>
				<ResponsiveModal.Title class="text-xl font-semibold italic">
					{m.transaction_edit_title()}
				</ResponsiveModal.Title>
			</ResponsiveModal.Header>

			<ResponsiveModal.Body>
				<form
					id={formId}
					class="flex flex-col gap-4"
					aria-label={m.transaction_edit_title()}
					{...submit.attrs}
					{@attach submit.anchor}
					{@attach initFieldsOnMount}
				>
					<input {...form.fields.accountId.as('hidden', transaction.accountId)} />
					<input {...form.fields.transactionId.as('hidden', transaction.id)} />

					<div class="grid gap-1.5">
						<Label>{m.transactions_table_header_category()}</Label>
						<SelectCategory
							name={form.fields.categoryId.as('select').name}
							bind:value={
								() => form!.fields.categoryId.value() ?? '', (v) => form!.fields.categoryId.set(v)
							}
							{categories}
							nullable
							ariaInvalid={form.fields.categoryId.issues()?.length ? true : undefined}
							ariaLabel={m.transactions_table_header_category()}
							ariaLabelTrigger={m.select_category_open()}
						/>
					</div>

					<div class="grid gap-1.5">
						<Label>{m.transactions_table_header_notes()}</Label>
						<Input
							aria-label={m.transactions_table_header_notes()}
							{...form.fields.notes.as('text', transaction.notes ?? '')}
						/>
					</div>

					{#if sealed}
						<SealedField label={m.transactions_table_header_date()} title={sealedTitle}>
							{formatTransactionDate(parseDate(transaction.date))}
						</SealedField>
						<input {...form.fields.date.as('hidden', transaction.date)} />
					{:else}
						<div class="grid gap-1.5">
							<Label>{m.transactions_table_header_date()}</Label>
							<DatePicker
								name={form.fields.date.as('date').name}
								bind:value={
									() => parseDate(form!.fields.date.value() ?? transaction!.date),
									(v) => form!.fields.date.set(v.toString())
								}
								ariaInvalid={form.fields.date.issues()?.length ? true : undefined}
								label={m.transaction_table_cell_date_select()}
							/>
						</div>
					{/if}

					{#if sealed}
						<SealedField
							label={m.transactions_table_header_amount()}
							title={sealedTitle}
							class="font-currency"
						>
							{formatMoney({ currency, money: asMoney(transaction.amount) })}
						</SealedField>
						<input {...form.fields.amount.as('hidden', transaction.amount)} />
					{:else}
						<div class="grid gap-1.5">
							<Label>{m.transactions_table_header_amount()}</Label>
							<InputMoney
								name={form.fields.amount.as('number').name}
								aria-label={m.transactions_table_header_amount()}
								bind:value={() => form!.fields.amount.value(), (v) => form!.fields.amount.set(v)}
								{currency}
								class="text-right font-currency"
							/>
						</div>
					{/if}

					{#if sealed}
						<!-- An omitted `validated` would read as unvalidating, which
						     the seal check rejects; it comes back unchanged. -->
						<div class="flex items-center gap-1">
							<ValidateToggle {transaction} scope="modal" class="m-0" />
							<span class="text-muted">{m.transaction_validated_label()}</span>
						</div>
						<input {...form.fields.validated.as('hidden', transaction.validated)} />
					{:else}
						<div class="flex items-center gap-1">
							<ValidationCheckbox
								{...form.fields.validated.as('checkbox', transaction.validated)}
							/>
							<span>{m.transaction_validated_label()}</span>
						</div>
					{/if}

					{#if form.fields.allIssues()?.length}
						<p role="alert" class="text-sm text-error">
							{form.fields
								.allIssues()
								?.map((issue) => issue.message)
								.join(' · ')}
						</p>
					{/if}
				</form>

				{#if sealed}
					<SealedNote {transaction} class="mt-4 px-0" />
				{/if}

				<form id={deleteFormId} class="hidden" {...deleteSubmit.attrs}></form>
			</ResponsiveModal.Body>

			<ResponsiveModal.Footer>
				<Button
					type="button"
					variant="ghost"
					class="h-11 w-full sm:w-auto"
					disabled={pending}
					onclick={() => (open = false)}
				>
					{m.cancel()}
				</Button>

				{#if !sealed}
					<Button
						type="submit"
						variant="destructive"
						class="h-11 w-full sm:w-auto"
						form={deleteFormId}
						name={deleteForm.fields.ids[0].as('submit', transaction.id).name}
						value={transaction.id}
						disabled={pending}
						{@attach deleteSubmit.anchor}
					>
						<TrashIcon />
						<span class="sr-only">{m.delete()}</span>
					</Button>
				{/if}

				<Button type="submit" form={formId} class="h-11 w-full sm:w-auto" disabled={pending}>
					{m.save()}
				</Button>
			</ResponsiveModal.Footer>
		{/if}
	</ResponsiveModal.Content>
</ResponsiveModal.Root>
