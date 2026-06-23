<script lang="ts">
	import type { Attachment } from 'svelte/attachments';

	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { DatePicker } from '$lib/components/ui/date-picker';
	import { Input } from '$lib/components/ui/input';
	import { InputCurrency } from '$lib/components/ui/input-currency';
	import { SelectCommand } from '$lib/components/ui/select-command';
	import { m } from '$lib/paraglide/messages';
	import { getBudget } from '$lib/remote-functions/budget.remote';
	import { getCategories } from '$lib/remote-functions/category.remote';
	import { createTransaction, listTransactions } from '$lib/remote-functions/transaction.remote';
	import { getLocalTimeZone, parseDate, today } from '@internationalized/date';
	import { Popover } from 'bits-ui';
	import { slide } from 'svelte/transition';
	import { cn } from 'tailwind-variants';

	import { colsClass, getTransactionURLParams } from './utils';
	import ValidationCheckbox from './validation-checkbox.svelte';

	let {
		accountId,
		budgetId,
		open = $bindable(false)
	}: { accountId: string; budgetId: string; open?: boolean } = $props();

	const form = $derived(createTransaction);
	const categories = $derived(await getCategories({ budgetId }));
	const budget = $derived(await getBudget(budgetId));

	let submitAndContinue = $state(false);
	let formElement: HTMLFormElement | null = $state(null);

	const submitWithKeyboard: Attachment<HTMLFormElement> = (node) => {
		const handle = (ev: KeyboardEvent) => {
			if (ev.key === 'Enter') {
				ev.preventDefault();
				submitAndContinue = ev.shiftKey;
				formElement?.requestSubmit();
			}
		};
		node.addEventListener('keydown', handle);
		return () => node.removeEventListener('keydown', handle);
	};

	const handleClosed = () => {
		submitAndContinue = false;
		form.fields.set({
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
		if (!isOpen) {
			handleClosed();
		}
	}}
>
	<Popover.ContentStatic forceMount>
		{#snippet child({ open: internalOpen, props })}
			{#if internalOpen}
				<form
					transition:slide={{ axis: 'y', duration: 200 }}
					class={cn(
						colsClass,
						'grid rounded-sm border border-interactive/30 bg-surface shadow shadow-interactive/15'
					)}
					role="row"
					aria-label={m.transactions_table_create_transaction()}
					{...props}
					bind:this={formElement}
					{...form.enhance(async (f) => {
						if (
							await f
								.submit()
								.updates(listTransactions({ accountId, ...getTransactionURLParams(page.url) }))
						) {
							if (!submitAndContinue) {
								open = false;
								f.element.reset();
							}
						}
					})}
					{@attach open && submitWithKeyboard}
				>
					<input {...form.fields.accountId.as('hidden', accountId)} />
					<input {...form.fields.budgetId.as('hidden', budgetId)} />

					<div role="cell" class="grid items-center bg-interactive/5 p-2">
						<SelectCommand
							name={form.fields.categoryId.as('select').name}
							bind:value={
								() => form.fields.categoryId.value(), (v) => form.fields.categoryId.set(v)
							}
							items={categories}
							textEmptyTrigger={m.transaction_table_cell_category_empty()}
							textInputPlaceholder={m.transaction_table_cell_category_placeholder()}
							textListEmpty={m.transaction_table_cell_category_empty()}
						/>
					</div>

					<div role="cell" class="grid items-center bg-interactive/5 p-2">
						<Input class="px-2" aria-label="Notes" {...form.fields.notes.as('text')} />
					</div>

					<div role="cell" class="grid items-center bg-interactive/5 p-2">
						<DatePicker
							name={form.fields.date.as('date').name}
							bind:value={
								() => {
									const d = form.fields.date.value();
									return d ? parseDate(d) : today(getLocalTimeZone());
								},
								(v) => form.fields.date.set(v.toString())
							}
							class="justify-end"
						/>
					</div>

					<div role="cell" class="grid items-center bg-interactive/5 p-2">
						<InputCurrency
							name={form.fields.amount.as('number').name}
							aria-label="Amount"
							bind:value={() => form.fields.amount.value() ?? 0, (v) => form.fields.amount.set(v)}
							currency={budget.currency}
							class="px-2 text-right font-currency font-medium"
						/>
					</div>

					<div role="cell" class="grid items-center bg-interactive/5 p-2">
						<ValidationCheckbox {...form.fields.validated.as('checkbox')} />
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
			{/if}
		{/snippet}
	</Popover.ContentStatic>
</Popover.Root>
