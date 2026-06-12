<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Calendar } from '$lib/components/ui/calendar';
	import { Input } from '$lib/components/ui/input';
	import { InputCurrency } from '$lib/components/ui/input-currency';
	import { SelectCommand } from '$lib/components/ui/select-command';
	import { m } from '$lib/paraglide/messages';
	import { getBudget } from '$lib/remote-functions/budget.remote';
	import { getCategoriesFlat } from '$lib/remote-functions/category.remote';
	import { editTransaction } from '$lib/remote-functions/transaction.remote';
	import { clickOutside } from '$lib/utils/click-outside';
	import { focusAndSelect } from '$lib/utils/focus-and-select';
	import { formatTransactionDate } from '$lib/utils/format-transaction-date';
	import { type CalendarDate, parseDate } from '@internationalized/date';
	import { Popover } from 'bits-ui';
	import { tick } from 'svelte';
	import { cn } from 'tailwind-variants';
	import PhTrash from '~icons/ph/trash';

	import ValidateCheckbox from './cells/validate-checkbox.svelte';

	type EditTransactionRowProps = {
		budgetId: string;
		gridColsClass: string;
		onCancel: () => void;
		transaction: {
			accountId: string;
			amount: number;
			categoryId: null | string;
			categoryName: null | string;
			date: string;
			id: string;
			notes: null | string;
			validated: boolean;
		};
	};

	let { budgetId, gridColsClass, onCancel, transaction }: EditTransactionRowProps = $props();

	const scopedForm = $derived(editTransaction.for(transaction.id));

	const currency = $derived((await getBudget({ budgetId })).currency);
	const categories = $derived(await getCategoriesFlat({ budgetId }));

	let inputRef = $state<HTMLInputElement>(null!);
	let categoryOpen = $state(false);
	let calendarOpen = $state(false);
	let calendarTriggerRef = $state<HTMLButtonElement>(null!);

	// Felder mit Transaktionsdaten initialisieren
	$effect(() => {
		scopedForm.fields.set({
			accountId: transaction.accountId,
			amount: transaction.amount,
			categoryId: transaction.categoryId ?? undefined,
			date: transaction.date,
			notes: transaction.notes ?? undefined,
			transactionId: transaction.id,
			validated: transaction.validated ?? false
		});
		tick().then(() => focusAndSelect(inputRef));
	});

	function deleteTransaction() {
		fetch('/api/transaction/delete', {
			body: JSON.stringify({ transactionIds: [transaction.id] }),
			method: 'POST'
		}).then((res) => {
			if (res.ok) {
				invalidateAll();
				onCancel();
			}
		});
	}

	function closeCalendar() {
		calendarOpen = false;
		tick().then(() => calendarTriggerRef.focus());
	}

	function getDateValue() {
		const d = scopedForm.fields.date.value();
		return d ? parseDate(d) : parseDate(transaction.date);
	}

	function setDateValue(newValue: CalendarDate) {
		scopedForm.fields.date.set(newValue.toString());
	}

	function getCategoryValue() {
		return scopedForm.fields.categoryId.value() ?? 'null';
	}

	function setCategoryValue(value: string) {
		scopedForm.fields.categoryId.set(value === 'null' ? undefined : value);
	}
</script>

<form
	role="row"
	class={cn(
		gridColsClass,
		'grid rounded-sm border border-interactive/30 bg-surface shadow shadow-interactive/15'
	)}
	{...scopedForm.enhance(async (f) => {
		if (await f.submit()) onCancel();
	})}
	{@attach clickOutside({ callback: onCancel })}
	onkeydown={(e) => {
		if (e.key === 'Escape') {
			e.stopPropagation();
			onCancel();
		}
	}}
>
	<input {...scopedForm.fields.accountId.as('hidden', transaction.accountId)} />
	<input {...scopedForm.fields.transactionId.as('hidden', transaction.id)} />

	<div role="cell" class="bg-interactive/5 p-2">
		<SelectCommand
			bind:open={categoryOpen}
			bind:value={getCategoryValue, setCategoryValue}
			items={categories}
			textEmptyTrigger={m.transaction_table_cell_category_empty()}
			textInputPlaceholder={m.transaction_table_cell_category_placeholder()}
			textListEmpty={m.transaction_table_cell_category_empty()}
		/>
	</div>

	<div role="cell" class="bg-interactive/5 p-2">
		<Input
			bind:ref={inputRef}
			class="px-2"
			name={scopedForm.fields.notes.as('text').name}
			bind:value={
				() => scopedForm.fields.notes.value() ?? '',
				(v) => scopedForm.fields.notes.set(v || undefined)
			}
		/>
	</div>

	<div role="cell" class="bg-interactive/5 p-2">
		<Popover.Root bind:open={calendarOpen}>
			<Popover.Trigger bind:ref={calendarTriggerRef}>
				{#snippet child({ props })}
					<Button
						{...props}
						type="button"
						variant="ghost"
						class="w-full justify-end border-muted/30 bg-surface/70 px-2 hover:cursor-text hover:bg-surface/70"
						role="combobox"
						aria-expanded={calendarOpen}
					>
						{scopedForm.fields.date.value()
							? formatTransactionDate(parseDate(scopedForm.fields.date.value()!))
							: m.transaction_table_cell_date_select()}
					</Button>
				{/snippet}
			</Popover.Trigger>

			<Popover.Content
				class="w-full p-0"
				sideOffset={4}
				onkeydown={(ev) => {
					if (ev.key === 'Escape') {
						closeCalendar();
						ev.stopPropagation();
					}
				}}
			>
				<Calendar
					type="single"
					bind:value={getDateValue, setDateValue}
					captionLayout="dropdown"
					onValueChange={() => closeCalendar()}
					class="rounded-xl border border-muted/30 bg-surface-high shadow"
				/>
			</Popover.Content>
		</Popover.Root>
	</div>

	<div role="cell" class="bg-interactive/5 p-2">
		<InputCurrency
			name={scopedForm.fields.amount.as('number').name}
			bind:value={
				() => scopedForm.fields.amount.value() ?? 0, (v) => scopedForm.fields.amount.set(v)
			}
			{currency}
			class="px-2 text-right font-currency font-medium"
		/>
	</div>

	<div role="cell" class="bg-interactive/5 p-2">
		<ValidateCheckbox {...scopedForm.fields.validated.as('checkbox', transaction.validated)} />
	</div>

	<div role="cell" class="col-span-full flex items-center justify-end gap-2 bg-interactive/5 p-2">
		<Button type="button" variant="ghost" onclick={onCancel}>
			{m.cancel()}
		</Button>

		<Button type="button" variant="destructive" size="icon" onclick={deleteTransaction}>
			<PhTrash />
			<span class="sr-only">{m.delete()}</span>
		</Button>

		<Button type="submit">
			{m.save()}
		</Button>
	</div>
</form>
