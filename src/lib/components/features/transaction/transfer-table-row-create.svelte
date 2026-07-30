<script lang="ts">
	import type { Attachment } from 'svelte/attachments';

	import { Button } from '$lib/components/ui/button';
	import { DatePicker } from '$lib/components/ui/date-picker';
	import { Input } from '$lib/components/ui/input';
	import { InputMoney } from '$lib/components/ui/input-money';
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
	import { Popover } from 'bits-ui';
	import { slide } from 'svelte/transition';
	import { cn } from 'tailwind-variants';

	import {
		cellClass,
		editInputClass,
		editRowClass,
		editSelectClass,
		footerButtonTouchClass
	} from './transaction-table-cols';
	import RowErrors from './transaction-table-row-errors.svelte';

	let {
		accountId,
		budgetId,
		class: className,
		interactOutsideIgnore = null,
		open = $bindable(false)
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
		// A transfer writes a leg into each account, so refresh every live
		// listTransactions instance and both accounts' balance queries (both legs'
		// registers and summaries) rather than just the viewed account's —
		// otherwise the counterpart stays stale until reload.
		updates: () => [listTransactions, getAccount, getAccountBalances]
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

	// Reopening on the same account keeps the draft; switching accounts resets
	// it. The factory keys the attachment on accountId so it re-runs when the
	// account changes while the form stays mounted (a reversed close/open
	// transition never unmounts it).
	let lastResetAccountId: string | undefined;

	const resetOnAccountChange =
		(forAccountId: string): Attachment<HTMLFormElement> =>
		() => {
			if (lastResetAccountId === forAccountId) return;
			lastResetAccountId = forAccountId;
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
	     form[role="row"], keeping the table's a11y tree valid. forceMount +
	     {#if open} hands presence to Svelte so the whole row can slide in/out. -->
	<Popover.ContentStatic
		forceMount
		onInteractOutside={(e) => {
			if (interactOutsideIgnore?.contains(e.target as Node)) e.preventDefault();
		}}
	>
		{#snippet child({ props })}
			{#if open}
				<form
					{...props}
					transition:slide={{ duration: 150 }}
					class={cn(className, 'grid', editRowClass)}
					role="row"
					aria-label={m.transactions_table_create_transfer()}
					bind:this={formElement}
					{...submit.attrs}
					{@attach submitWithKeyboard}
					{@attach submit.anchor}
					{@attach resetOnAccountChange(accountId)}
				>
					<input {...createTransfer.fields.accountId.as('hidden', accountId)} />
					<input {...createTransfer.fields.budgetId.as('hidden', budgetId)} />

					<div role="cell" class={cellClass}>
						<SelectCategory
							class={cn(editInputClass, editSelectClass)}
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

					<div role="cell" class={cellClass}>
						<Input
							class={cn(editInputClass, 'text-sm')}
							aria-label={m.transactions_table_header_notes()}
							{...createTransfer.fields.notes.as('text')}
						/>
					</div>

					<div role="cell" class={cellClass}>
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
							class={cn(editInputClass, 'justify-end')}
							label={m.transaction_table_cell_date_select()}
						/>
					</div>

					<div role="cell" class={cellClass}>
						<InputMoney
							name={createTransfer.fields.amount.as('number').name}
							aria-label={m.transactions_table_header_amount()}
							bind:value={
								() => createTransfer.fields.amount.value(),
								(v) => createTransfer.fields.amount.set(v)
							}
							currency={budget.currency}
							class={cn(editInputClass, 'text-right font-currency')}
						/>
					</div>

					<!-- Empty (transfer legs start pending) but keeps the validated
					     column so both create rows line up. -->
					<div role="cell" class={cellClass}></div>

					<RowErrors issues={createTransfer.fields.allIssues()} />

					<div role="cell" class="col-span-full flex items-center justify-between gap-1 p-1">
						<p class="px-1 text-sm text-muted">{m.transfer_amount_hint()}</p>

						<div class="flex items-center gap-1">
							<Button
								type="button"
								size="xs"
								class={footerButtonTouchClass}
								variant="ghost"
								disabled={submit.pending}
								onclick={() => (open = false)}
							>
								{m.cancel()}
							</Button>

							<Button
								type="submit"
								size="xs"
								class={footerButtonTouchClass}
								disabled={submit.pending}
							>
								{m.save()}
							</Button>
						</div>
					</div>
				</form>
			{/if}
		{/snippet}
	</Popover.ContentStatic>
</Popover.Root>
