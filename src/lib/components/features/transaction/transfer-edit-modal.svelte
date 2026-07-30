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
	import {
		getAccount,
		getAccountBalances,
		getAccounts
	} from '$lib/remote-functions/account.remote';
	import {
		batchDeleteTransactions,
		editTransfer,
		listTransactions
	} from '$lib/remote-functions/transaction.remote';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';
	import { parseDate } from '@internationalized/date';
	import TrashIcon from '~icons/ph/trash';

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

	const accounts = $derived(await getAccounts(budgetId));
	const counterpartAccounts = $derived(
		accounts.filter((account) => account.id !== transaction?.accountId)
	);

	const id = $props.id();

	// Scoped per transaction id, so reopening for another leg gets a fresh form
	// instance instead of the previous one's field state.
	const form = $derived(transaction === null ? null : editTransfer.for(transaction.id));
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
		updates: () => [listTransactions, getAccount, getAccountBalances]
	});

	// Deleting either leg removes the whole transfer server-side (ADR-0015);
	// the sheet must close itself once the delete lands.
	const deleteSubmit = createFormSubmit(() => deleteForm!, {
		onSuccess: () => {
			open = false;
		},
		toast: {},
		updates: () => [listTransactions, getAccount, getAccountBalances]
	});

	const pending = $derived(submit.pending || deleteSubmit.pending);

	// The form mounts each time the sheet opens; seed the two fields whose
	// inputs bind to field state instead of an `as(...)` default.
	const initFieldsOnMount: Attachment<HTMLFormElement> = () => {
		if (transaction === null || form === null) return;
		form.fields.counterpartAccountId.set(transaction.counterpartAccountId ?? '');
		form.fields.amount.set(transaction.amount);
	};
</script>

<ResponsiveModal.Root bind:open onOpenChangeComplete={(isOpen) => !isOpen && (transaction = null)}>
	<ResponsiveModal.Content>
		{#if transaction !== null && form !== null && deleteForm !== null}
			<ResponsiveModal.Header>
				<ResponsiveModal.Title class="text-xl font-semibold italic">
					{m.transfer_edit_title()}
				</ResponsiveModal.Title>
			</ResponsiveModal.Header>

			<ResponsiveModal.Body>
				<form
					id={formId}
					class="flex flex-col gap-4"
					aria-label={m.transfer_edit_title()}
					{...submit.attrs}
					{@attach submit.anchor}
					{@attach initFieldsOnMount}
				>
					<input {...form.fields.accountId.as('hidden', transaction.accountId)} />
					<input {...form.fields.transferId.as('hidden', transaction.transferId ?? '')} />

					<div class="grid gap-1.5">
						<Label>{m.transfer_counterpart_account_label()}</Label>
						<SelectCategory
							name={form.fields.counterpartAccountId.as('select').name}
							bind:value={
								() => form!.fields.counterpartAccountId.value() ?? '',
								(v) => form!.fields.counterpartAccountId.set(v)
							}
							categories={counterpartAccounts}
							ariaInvalid={form.fields.counterpartAccountId.issues()?.length ? true : undefined}
							ariaLabel={m.transfer_counterpart_account_label()}
							ariaLabelTrigger={m.select_account_open()}
							placeholder={m.select_account_placeholder()}
							textNotFound={m.select_account_not_found()}
						/>
					</div>

					<div class="grid gap-1.5">
						<Label>{m.transactions_table_header_notes()}</Label>
						<Input
							aria-label={m.transactions_table_header_notes()}
							{...form.fields.notes.as('text', transaction.notes ?? '')}
						/>
					</div>

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

					<div class="grid gap-1.5">
						<Label>{m.transactions_table_header_amount()}</Label>
						<InputMoney
							name={form.fields.amount.as('number').name}
							aria-label={m.transactions_table_header_amount()}
							bind:value={() => form!.fields.amount.value(), (v) => form!.fields.amount.set(v)}
							{currency}
							class="text-right font-currency"
						/>
						<p class="text-sm text-muted">{m.transfer_amount_hint()}</p>
					</div>

					{#if form.fields.allIssues()?.length}
						<p role="alert" class="text-sm text-error">
							{form.fields
								.allIssues()
								?.map((issue) => issue.message)
								.join(' · ')}
						</p>
					{/if}
				</form>

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

				<Button type="submit" form={formId} class="h-11 w-full sm:w-auto" disabled={pending}>
					{m.save()}
				</Button>
			</ResponsiveModal.Footer>
		{/if}
	</ResponsiveModal.Content>
</ResponsiveModal.Root>
