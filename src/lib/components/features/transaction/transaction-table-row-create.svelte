<script lang="ts">
	import type { TransactionsURLParams } from '$lib/schemas/transaction';
	import type { Attachment } from 'svelte/attachments';

	import { Button } from '$lib/components/ui/button';
	import { DatePicker } from '$lib/components/ui/date-picker';
	import { Input } from '$lib/components/ui/input';
	import { InputCurrency } from '$lib/components/ui/input-currency';
	import { SelectCategory } from '$lib/components/ui/select-category';
	import { m } from '$lib/paraglide/messages';
	import { getBudget } from '$lib/remote-functions/budget.remote';
	import { getCategories } from '$lib/remote-functions/category.remote';
	import { createTransaction, listTransactions } from '$lib/remote-functions/transaction.remote';
	import { getLocalTimeZone, parseDate, today } from '@internationalized/date';
	import { Popover } from 'bits-ui';
	import { cn } from 'tailwind-variants';

	import ValidationCheckbox from './transaction-validation-checkbox.svelte';

	let {
		accountId,
		budgetId,
		class: className,
		open = $bindable(false),
		urlParams
	}: {
		accountId: string;
		budgetId: string;
		class?: string;
		open?: boolean;
		urlParams: TransactionsURLParams;
	} = $props();

	const categories = $derived(await getCategories({ budgetId }));
	const budget = $derived(await getBudget(budgetId));

	let submitAndContinue = $state(false);
	let formElement: HTMLFormElement | null = $state(null);

	const submitWithKeyboard: Attachment<HTMLFormElement> = (node) => {
		const handle = (ev: KeyboardEvent) => {
			if (ev.key === 'Enter' && !(ev.target as HTMLElement)?.closest('[role="combobox"]')) {
				ev.preventDefault();
				submitAndContinue = ev.shiftKey;
				formElement?.requestSubmit();
			}
		};
		node.addEventListener('keydown', handle);
		return () => node.removeEventListener('keydown', handle);
	};

	const reset = () => {
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

<Popover.Root
	bind:open
	onOpenChangeComplete={(isOpen) => {
		if (isOpen) {
			reset();
		}
	}}
>
	<Popover.ContentStatic>
		<form
			class={cn(
				className,
				'grid rounded-sm border border-interactive/30 bg-surface shadow shadow-interactive/15'
			)}
			role="row"
			aria-label={m.transactions_table_create_transaction()}
			bind:this={formElement}
			{...createTransaction.enhance(async (f) => {
				if (await f.submit().updates(listTransactions({ accountId, ...urlParams }))) {
					if (!submitAndContinue) {
						f.element.reset();
						open = false;
					}
				}
			})}
			{@attach open && submitWithKeyboard}
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
				<InputCurrency
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

			<div role="cell" class="grid items-center bg-interactive/5 p-2">
				<ValidationCheckbox {...createTransaction.fields.validated.as('checkbox')} />
			</div>

			<div
				role="cell"
				class="col-span-full flex items-center justify-end gap-2 bg-interactive/5 p-2"
			>
				<Button type="button" variant="ghost" onclick={() => (open = false)}>
					{m.cancel()}
				</Button>

				<Button type="submit" onclick={() => (submitAndContinue = false)}>{m.save()}</Button>

				<Button type="submit" onclick={() => (submitAndContinue = true)}>
					{m.save_and_continue()}
				</Button>
			</div>
		</form>
	</Popover.ContentStatic>
</Popover.Root>
