<script lang="ts">
	import type { TransactionsURLParams } from '$lib/schemas/transaction';
	import type { Attachment } from 'svelte/attachments';

	import { Button } from '$lib/components/ui/button';
	import { DatePicker } from '$lib/components/ui/date-picker';
	import { Input } from '$lib/components/ui/input';
	import { InputMoney } from '$lib/components/ui/input-money';
	import { SelectCategory } from '$lib/components/ui/select-category';
	import { m } from '$lib/paraglide/messages';
	import { getBudget } from '$lib/remote-functions/budget.remote';
	import { getCategories } from '$lib/remote-functions/category.remote';
	import { createTransaction, listTransactions } from '$lib/remote-functions/transaction.remote';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';
	import { getLocalTimeZone, parseDate, today } from '@internationalized/date';
	import { Popover } from 'bits-ui';
	import { cn } from 'tailwind-variants';

	import RowErrors from './transaction-table-row-errors.svelte';
	import ValidationCheckbox from './transaction-validation-checkbox.svelte';

	let {
		accountId,
		budgetId,
		class: className,
		interactOutsideIgnore = null,
		open = $bindable(false),
		urlParams
	}: {
		accountId: string;
		budgetId: string;
		class?: string;
		/**
		 * Outside interactions inside this element do not dismiss the row. The
		 * table passes its trigger button group so the buttons can implement
		 * toggle/switch semantics without the dismiss layer racing them.
		 */
		interactOutsideIgnore?: HTMLElement | null;
		open?: boolean;
		urlParams: TransactionsURLParams;
	} = $props();

	const categories = $derived(await getCategories({ budgetId }));
	const budget = $derived(await getBudget(budgetId));

	let submitAndContinue = $state(false);
	let formElement: HTMLFormElement | null = $state(null);

	// Row-scoped micro-form (ADR-0009): thrown errors go to the anchored toast,
	// validation issues to the shared row error line below the fields.
	const submit = createFormSubmit(() => createTransaction, {
		onSuccess: (form) => {
			if (submitAndContinue) return;
			form.element.reset();
			open = false;
		},
		toast: {},
		updates: () => [listTransactions({ accountId, ...urlParams })]
	});

	const submitWithKeyboard: Attachment<HTMLFormElement> = (node) => {
		const handle = (ev: KeyboardEvent) => {
			if (submit.pending) return;
			if (ev.key === 'Enter' && !(ev.target as HTMLElement)?.closest('[role="combobox"]')) {
				ev.preventDefault();
				submitAndContinue = ev.shiftKey;
				formElement?.requestSubmit();
			}
		};
		node.addEventListener('keydown', handle);
		return () => node.removeEventListener('keydown', handle);
	};

	// The draft is scoped to one account (carried as the hidden accountId), so it
	// is stale once the viewed account changes. Reset the fields when the form
	// next mounts for a different account; reopening on the SAME account keeps the
	// draft. This replaces the old reset-on-open, which was dead code (bits-ui
	// never fires onOpenChangeComplete(true) for static popover content).
	let lastResetAccountId: string | undefined;

	const resetOnAccountChange: Attachment<HTMLFormElement> = () => {
		if (lastResetAccountId === accountId) return;
		lastResetAccountId = accountId;
		submitAndContinue = false;
		createTransaction.fields.set({
			amount: 0,
			categoryId: undefined,
			date: today(getLocalTimeZone()).toString(),
			notes: undefined,
			validated: false
		});
	};
</script>

<Popover.Root bind:open>
	<!-- Render the popover content ONTO the form via `child`: no wrapper div sits
	     between the rowgroup and form[role="row"], so the table's a11y tree stays
	     valid (a table/rowgroup may only own rows — an intermediate generic or
	     presentation div fails aria-required-children). -->
	<Popover.ContentStatic
		onInteractOutside={(e) => {
			if (interactOutsideIgnore?.contains(e.target as Node)) e.preventDefault();
		}}
	>
		{#snippet child({ props })}
			<form
				{...props}
				class={cn(
					className,
					'grid rounded-sm border border-interactive/30 bg-surface shadow shadow-interactive/15'
				)}
				role="row"
				aria-label={m.transactions_table_create_transaction()}
				bind:this={formElement}
				{...submit.attrs}
				{@attach open && submitWithKeyboard}
				{@attach submit.anchor}
				{@attach resetOnAccountChange}
			>
				<input {...createTransaction.fields.accountId.as('hidden', accountId)} />
				<input {...createTransaction.fields.budgetId.as('hidden', budgetId)} />

				<div role="cell" class="grid items-center bg-interactive/5 p-2">
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

				<div role="cell" class="grid items-center bg-interactive/5 p-2">
					<Input class="px-2" aria-label="Notes" {...createTransaction.fields.notes.as('text')} />
				</div>

				<div role="cell" class="grid items-center bg-interactive/5 p-2">
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
						class="justify-end"
						label={m.transaction_table_cell_date_select()}
					/>
				</div>

				<div role="cell" class="grid items-center bg-interactive/5 p-2">
					<InputMoney
						name={createTransaction.fields.amount.as('number').name}
						aria-label="Amount"
						bind:value={
							() => createTransaction.fields.amount.value(),
							(v) => createTransaction.fields.amount.set(v)
						}
						currency={budget.currency}
						class="px-2 text-right font-currency font-medium"
					/>
				</div>

				<div role="cell" class="grid place-content-center bg-interactive/5 p-2">
					<ValidationCheckbox {...createTransaction.fields.validated.as('checkbox')} />
				</div>

				<RowErrors issues={createTransaction.fields.allIssues()} />

				<div
					role="cell"
					class="col-span-full flex items-center justify-end gap-2 bg-interactive/5 p-2"
				>
					<Button
						type="button"
						variant="ghost"
						disabled={submit.pending}
						onclick={() => (open = false)}
					>
						{m.cancel()}
					</Button>

					<Button
						type="submit"
						disabled={submit.pending}
						onclick={() => (submitAndContinue = false)}
					>
						{m.save()}
					</Button>

					<Button
						type="submit"
						disabled={submit.pending}
						onclick={() => (submitAndContinue = true)}
					>
						{m.save_and_continue()}
					</Button>
				</div>
			</form>
		{/snippet}
	</Popover.ContentStatic>
</Popover.Root>
