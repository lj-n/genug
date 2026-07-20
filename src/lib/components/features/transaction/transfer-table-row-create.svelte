<script lang="ts">
	import type { TransactionsURLParams } from '$lib/schemas/transaction';
	import type { Attachment } from 'svelte/attachments';

	import { Button } from '$lib/components/ui/button';
	import { DatePicker } from '$lib/components/ui/date-picker';
	import { Input } from '$lib/components/ui/input';
	import { InputMoney } from '$lib/components/ui/input-money';
	import { SelectCategory } from '$lib/components/ui/select-category';
	import { m } from '$lib/paraglide/messages';
	import { getAccounts } from '$lib/remote-functions/account.remote';
	import { getBudget } from '$lib/remote-functions/budget.remote';
	import { createTransfer, listTransactions } from '$lib/remote-functions/transaction.remote';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';
	import { getLocalTimeZone, parseDate, today } from '@internationalized/date';
	import { Popover } from 'bits-ui';
	import { cn } from 'tailwind-variants';

	import RowErrors from './transaction-table-row-errors.svelte';

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

	const accounts = $derived(await getAccounts(budgetId));
	const budget = $derived(await getBudget(budgetId));

	// The viewed account is one leg by definition; only the other side is picked.
	const counterpartAccounts = $derived(accounts.filter((account) => account.id !== accountId));

	let formElement: HTMLFormElement | null = $state(null);

	// Row-scoped micro-form (ADR-0009): thrown errors go to the anchored toast,
	// validation issues to the shared row error line below the fields.
	const submit = createFormSubmit(() => createTransfer, {
		onSuccess: (form) => {
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
		createTransfer.fields.set({
			amount: 0,
			counterpartAccountId: '',
			date: today(getLocalTimeZone()).toString(),
			notes: undefined
		});
	};
</script>

<Popover.Root bind:open>
	<!-- Render the popover content ONTO the form via `child`: see
	     transaction-table-row-create — no wrapper div between the rowgroup and
	     form[role="row"], keeping the table's a11y tree valid. -->
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
				aria-label={m.transactions_table_create_transfer()}
				bind:this={formElement}
				{...submit.attrs}
				{@attach open && submitWithKeyboard}
				{@attach submit.anchor}
				{@attach resetOnAccountChange}
			>
				<input {...createTransfer.fields.accountId.as('hidden', accountId)} />
				<input {...createTransfer.fields.budgetId.as('hidden', budgetId)} />

				<div role="cell" class="grid items-center bg-interactive/5 p-2">
					<SelectCategory
						name={createTransfer.fields.counterpartAccountId.as('select').name}
						bind:value={
							() => createTransfer.fields.counterpartAccountId.value() ?? '',
							(v) => createTransfer.fields.counterpartAccountId.set(v)
						}
						categories={counterpartAccounts}
						ariaInvalid={createTransfer.fields.counterpartAccountId.issues()?.length
							? true
							: undefined}
						ariaLabel={m.transfer_counterpart_account_label()}
						ariaLabelTrigger={m.select_account_open()}
						placeholder={m.select_account_placeholder()}
						textNotFound={m.select_account_not_found()}
					/>
				</div>

				<div role="cell" class="grid items-center bg-interactive/5 p-2">
					<Input class="px-2" aria-label="Notes" {...createTransfer.fields.notes.as('text')} />
				</div>

				<div role="cell" class="grid items-center bg-interactive/5 p-2">
					<DatePicker
						name={createTransfer.fields.date.as('date').name}
						bind:value={
							() => {
								const d = createTransfer.fields.date.value();
								return d ? parseDate(d) : today(getLocalTimeZone());
							},
							(v) => createTransfer.fields.date.set(v.toString())
						}
						ariaInvalid={createTransfer.fields.date.issues()?.length ? true : undefined}
						class="justify-end"
						label={m.transaction_table_cell_date_select()}
					/>
				</div>

				<div role="cell" class="grid items-center bg-interactive/5 p-2">
					<InputMoney
						name={createTransfer.fields.amount.as('number').name}
						aria-label={m.transactions_table_header_amount()}
						bind:value={
							() => createTransfer.fields.amount.value(), (v) => createTransfer.fields.amount.set(v)
						}
						currency={budget.currency}
						class="px-2 text-right font-currency font-medium"
					/>
				</div>

				<!-- Empty (transfer legs start pending) but sized like the validate
			     checkbox of the transaction create row, so both rows line up. -->
				<div role="cell" class="grid min-h-14 place-content-center bg-interactive/5 p-2"></div>

				<RowErrors issues={createTransfer.fields.allIssues()} />

				<div
					role="cell"
					class="col-span-full flex items-center justify-between gap-2 bg-interactive/5 p-2"
				>
					<p class="px-1 text-sm text-muted">{m.transfer_amount_hint()}</p>

					<div class="flex items-center gap-2">
						<Button
							type="button"
							variant="ghost"
							disabled={submit.pending}
							onclick={() => (open = false)}
						>
							{m.cancel()}
						</Button>

						<Button type="submit" disabled={submit.pending}>
							{m.save()}
						</Button>
					</div>
				</div>
			</form>
		{/snippet}
	</Popover.ContentStatic>
</Popover.Root>
