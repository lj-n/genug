<script lang="ts">
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
	import { getBudget } from '$lib/remote-functions/budget.remote';
	import { createTransfer, listTransactions } from '$lib/remote-functions/transaction.remote';
	import { createFormSubmit } from '$lib/utils/form-submit.svelte';
	import { getLocalTimeZone, parseDate, today } from '@internationalized/date';

	let {
		accountId,
		budgetId,
		open = $bindable(false)
	}: {
		accountId: string;
		budgetId: string;
		open?: boolean;
	} = $props();

	const accounts = $derived(await getAccounts(budgetId));
	const budget = $derived(await getBudget(budgetId));

	// The viewed account is one leg by definition; only the other side is picked.
	const counterpartAccounts = $derived(accounts.filter((account) => account.id !== accountId));

	// The footer buttons live outside the <form> (in the pinned Footer, see
	// ADR-0013) and submit via the form attribute.
	const formId = $props.id();

	const submit = createFormSubmit(() => createTransfer, {
		onSuccess: () => {
			open = false;
		},
		toast: {},
		// A transfer writes a leg into each account, so refresh every live
		// listTransactions instance and both accounts' balance queries (both legs'
		// registers and summaries) rather than just the viewed account's —
		// otherwise the counterpart stays stale until reload.
		updates: () => [listTransactions, getAccount, getAccountBalances]
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
		createTransfer.fields.set({
			amount: 0,
			counterpartAccountId: '',
			date: today(getLocalTimeZone()).toString(),
			notes: undefined
		});
	};
</script>

<ResponsiveModal.Root bind:open>
	<ResponsiveModal.Content>
		<ResponsiveModal.Header>
			<ResponsiveModal.Title class="text-xl font-semibold italic">
				{m.transactions_table_create_transfer()}
			</ResponsiveModal.Title>
		</ResponsiveModal.Header>

		<ResponsiveModal.Body>
			<form
				id={formId}
				class="flex flex-col gap-4"
				aria-label={m.transactions_table_create_transfer()}
				{...submit.attrs}
				{@attach submit.anchor}
				{@attach resetOnAccountChange}
			>
				<input {...createTransfer.fields.accountId.as('hidden', accountId)} />
				<input {...createTransfer.fields.budgetId.as('hidden', budgetId)} />

				<div class="grid gap-1.5">
					<Label>{m.transfer_counterpart_account_label()}</Label>
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

				<div class="grid gap-1.5">
					<Label>{m.transactions_table_header_notes()}</Label>
					<Input
						aria-label={m.transactions_table_header_notes()}
						{...createTransfer.fields.notes.as('text')}
					/>
				</div>

				<div class="grid gap-1.5">
					<Label>{m.transactions_table_header_date()}</Label>
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
						label={m.transaction_table_cell_date_select()}
					/>
				</div>

				<div class="grid gap-1.5">
					<Label>{m.transactions_table_header_amount()}</Label>
					<InputMoney
						name={createTransfer.fields.amount.as('number').name}
						aria-label={m.transactions_table_header_amount()}
						bind:value={
							() => createTransfer.fields.amount.value(), (v) => createTransfer.fields.amount.set(v)
						}
						currency={budget.currency}
						class="text-right font-currency"
					/>
					<p class="text-sm text-muted">{m.transfer_amount_hint()}</p>
				</div>

				{#if createTransfer.fields.allIssues()?.length}
					<p role="alert" class="text-sm text-error">
						{createTransfer.fields
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
