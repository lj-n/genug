<script lang="ts">
	import type { TransactionsURLParams } from '$lib/schemas/transaction';
	import type { Attachment } from 'svelte/attachments';

	import { Button } from '$lib/components/ui/button';
	import { DatePicker } from '$lib/components/ui/date-picker';
	import { Input } from '$lib/components/ui/input';
	import { InputMoney } from '$lib/components/ui/input-money';
	import { Label } from '$lib/components/ui/label';
	import * as ResponsiveModal from '$lib/components/ui/responsive-modal';
	import { SelectCategory } from '$lib/components/ui/select-category';
	import { m } from '$lib/paraglide/messages';
	import { getBudget } from '$lib/remote-functions/budget.remote';
	import { getCategories } from '$lib/remote-functions/category.remote';
	import { createTransaction, listTransactions } from '$lib/remote-functions/transaction.remote';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';
	import { getLocalTimeZone, parseDate, today } from '@internationalized/date';

	import ValidationCheckbox from './transaction-validation-checkbox.svelte';

	let {
		accountId,
		budgetId,
		open = $bindable(false),
		urlParams
	}: {
		accountId: string;
		budgetId: string;
		open?: boolean;
		urlParams: TransactionsURLParams;
	} = $props();

	const categories = $derived(await getCategories({ budgetId }));
	const budget = $derived(await getBudget(budgetId));

	// The footer buttons live outside the <form> (in the pinned Footer, see
	// ADR-0013) and submit via the form attribute.
	const formId = $props.id();

	const submit = createFormSubmit(() => createTransaction, {
		onSuccess: () => {
			open = false;
		},
		toast: {},
		updates: () => [listTransactions({ accountId, ...urlParams })]
	});

	// The draft is scoped to one account (carried as the hidden accountId), so it
	// is stale once the viewed account changes. Reset the fields when the form
	// next mounts for a different account; reopening on the SAME account keeps the
	// draft. This deliberately covers cross-budget and same-budget switches, and
	// avoids the unreliable reset-on-open (bits-ui never fires
	// onOpenChangeComplete(true) for static content).
	let lastResetAccountId: string | undefined;

	const resetOnAccountChange: Attachment<HTMLFormElement> = () => {
		if (lastResetAccountId === accountId) return;
		lastResetAccountId = accountId;
		createTransaction.fields.set({
			amount: 0,
			categoryId: undefined,
			date: today(getLocalTimeZone()).toString(),
			notes: undefined,
			validated: false
		});
	};
</script>

<ResponsiveModal.Root bind:open>
	<ResponsiveModal.Content>
		<ResponsiveModal.Header>
			<ResponsiveModal.Title class="text-xl font-semibold italic">
				{m.transactions_table_create_transaction()}
			</ResponsiveModal.Title>
		</ResponsiveModal.Header>

		<ResponsiveModal.Body>
			<form
				id={formId}
				class="flex flex-col gap-4"
				aria-label={m.transactions_table_create_transaction()}
				{...submit.attrs}
				{@attach submit.anchor}
				{@attach resetOnAccountChange}
			>
				<input {...createTransaction.fields.accountId.as('hidden', accountId)} />
				<input {...createTransaction.fields.budgetId.as('hidden', budgetId)} />

				<div class="grid gap-1.5">
					<Label>{m.transactions_table_header_category()}</Label>
					<SelectCategory
						name={createTransaction.fields.categoryId.as('select').name}
						bind:value={
							() => createTransaction.fields.categoryId.value() ?? '',
							(v) => createTransaction.fields.categoryId.set(v)
						}
						{categories}
						nullable
						ariaInvalid={createTransaction.fields.categoryId.issues()?.length ? true : undefined}
						ariaLabel={m.transactions_table_header_category()}
						ariaLabelTrigger={m.select_category_open()}
					/>
				</div>

				<div class="grid gap-1.5">
					<Label>{m.transactions_table_header_notes()}</Label>
					<Input
						aria-label={m.transactions_table_header_notes()}
						{...createTransaction.fields.notes.as('text')}
					/>
				</div>

				<div class="grid gap-1.5">
					<Label>{m.transactions_table_header_date()}</Label>
					<DatePicker
						name={createTransaction.fields.date.as('date').name}
						bind:value={
							() => {
								const d = createTransaction.fields.date.value();
								return d ? parseDate(d) : today(getLocalTimeZone());
							},
							(v) => createTransaction.fields.date.set(v.toString())
						}
						ariaInvalid={createTransaction.fields.date.issues()?.length ? true : undefined}
						label={m.transaction_table_cell_date_select()}
					/>
				</div>

				<div class="grid gap-1.5">
					<Label>{m.transactions_table_header_amount()}</Label>
					<InputMoney
						name={createTransaction.fields.amount.as('number').name}
						aria-label={m.transactions_table_header_amount()}
						bind:value={
							() => createTransaction.fields.amount.value(),
							(v) => createTransaction.fields.amount.set(v)
						}
						currency={budget.currency}
						class="text-right font-currency"
					/>
				</div>

				<div class="flex items-center gap-1">
					<ValidationCheckbox {...createTransaction.fields.validated.as('checkbox')} />
					<span>{m.transaction_validated_label()}</span>
				</div>

				{#if createTransaction.fields.allIssues()?.length}
					<p role="alert" class="text-sm text-error">
						{createTransaction.fields
							.allIssues()
							?.map((issue) => issue.message)
							.join(' · ')}
					</p>
				{/if}
			</form>
		</ResponsiveModal.Body>

		<ResponsiveModal.Footer>
			<Button
				type="button"
				variant="ghost"
				class="h-11 w-full sm:w-auto"
				disabled={submit.pending}
				onclick={() => (open = false)}
			>
				{m.cancel()}
			</Button>

			<Button type="submit" form={formId} class="h-11 w-full sm:w-auto" disabled={submit.pending}>
				{m.save()}
			</Button>
		</ResponsiveModal.Footer>
	</ResponsiveModal.Content>
</ResponsiveModal.Root>
