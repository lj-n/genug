<script lang="ts">
	import type { ListTransaction } from '$lib/server/db/user-context/transaction';

	import { ValidationCheckbox } from '$lib/components/features/transaction';
	import { Button } from '$lib/components/ui/button';
	import { DatePicker } from '$lib/components/ui/date-picker';
	import { Input } from '$lib/components/ui/input';
	import { InputCurrency } from '$lib/components/ui/input-currency';
	import { SelectCategory } from '$lib/components/ui/select-category';
	import { m } from '$lib/paraglide/messages';
	import { getBudget } from '$lib/remote-functions/budget.remote';
	import { getCategories } from '$lib/remote-functions/category.remote';
	import {
		batchDeleteTransactions,
		editTransaction,
		listTransactions
	} from '$lib/remote-functions/transaction.remote';
	import { clickOutside } from '$lib/utils/click-outside';
	import { parseDate } from '@internationalized/date';
	import { onMount } from 'svelte';
	import { cn } from 'tailwind-variants';
	import TrashIcon from '~icons/ph/trash';

	import { colsClass } from './utils';

	let {
		budgetId,
		cancelEditing,
		transaction
	}: { budgetId: string; cancelEditing: () => void; transaction: ListTransaction } = $props();

	const id = $props.id();
	const form = editTransaction.for(id);
	const deleteFormId = `dform-${id}`;

	const budgetQuery = $derived(getBudget(budgetId));
	const categoriesQuery = $derived(getCategories({ budgetId }));

	const budget = $derived(await budgetQuery);
	const categories = $derived(await categoriesQuery);

	onMount(() => {
		form.fields.categoryId.set(transaction.categoryId ?? undefined);
	});
</script>

<form
	{...form.enhance(async (f) => {
		if (await f.submit().updates(listTransactions)) {
			cancelEditing();
		}
	})}
	role="row"
	class={cn(
		colsClass,
		'grid rounded-sm border border-interactive/30 bg-surface shadow shadow-interactive/15'
	)}
	{@attach clickOutside({ callback: cancelEditing })}
	onkeydown={(e) => {
		if (e.key === 'Escape') {
			e.stopPropagation();
			cancelEditing();
		}
	}}
>
	<input {...form.fields.accountId.as('hidden', transaction.accountId)} />
	<input {...form.fields.transactionId.as('hidden', transaction.id)} />

	<div role="cell" class="grid items-center bg-interactive/5 p-2">
		<SelectCategory
			name={form.fields.categoryId.as('select').name}
			bind:value={() => form.fields.categoryId.value() ?? '', (v) => form.fields.categoryId.set(v)}
			{categories}
			nullable
			ariaInvalid={form.fields.categoryId.issues()?.length ? true : undefined}
			ariaLabel={m.transactions_table_header_category()}
			ariaLabelTrigger={m.select_category_open()}
		/>
	</div>

	<div role="cell" class="grid items-center bg-interactive/5 p-2">
		<Input
			class="px-2"
			aria-label={m.transactions_table_header_notes()}
			{...form.fields.notes.as('text', transaction.notes ?? '')}
		/>
	</div>

	<div role="cell" class="grid items-center bg-interactive/5 p-2">
		<DatePicker
			name={form.fields.date.as('date').name}
			bind:value={
				() => parseDate(form.fields.date.value() ?? transaction.date),
				(v) => form.fields.date.set(v.toString())
			}
			ariaInvalid={form.fields.date.issues()?.length ? true : undefined}
			class="justify-end"
			label={m.transaction_table_cell_date_select()}
		/>
	</div>

	<div role="cell" class="grid items-center bg-interactive/5 p-2">
		<InputCurrency
			name={form.fields.amount.as('number').name}
			aria-label={m.transactions_table_header_amount()}
			bind:value={
				() => form.fields.amount.value() ?? transaction.amount, (v) => form.fields.amount.set(v)
			}
			currency={budget.currency}
			class="px-2 text-right font-currency font-normal"
		/>
	</div>

	<div role="cell" class="grid items-center bg-interactive/5 p-2">
		<ValidationCheckbox {...form.fields.validated.as('checkbox', transaction.validated)} />
	</div>

	<div role="cell" class="col-span-full flex items-center justify-end gap-2 bg-interactive/5 p-2">
		<Button type="button" variant="ghost" onclick={cancelEditing}>
			{m.cancel()}
		</Button>

		<Button
			type="submit"
			variant="destructive"
			size="icon"
			form={deleteFormId}
			value={[transaction.id]}
		>
			<TrashIcon />
			<span class="sr-only">{m.delete()}</span>
		</Button>

		<Button type="submit">
			{m.save()}
		</Button>
	</div>
</form>

<form id={deleteFormId} class="hidden" {...batchDeleteTransactions.for(id)}></form>
