<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { Calendar } from '$lib/components/ui/calendar';
	import { Input } from '$lib/components/ui/input';
	import { InputCurrency } from '$lib/components/ui/input-currency';
	import { SelectCommand } from '$lib/components/ui/select-command';
	import { m } from '$lib/paraglide/messages';
	import { getBudget } from '$lib/remote-functions/budget.remote';
	import { getCategoriesFlat } from '$lib/remote-functions/category.remote';
	import { createTransaction } from '$lib/remote-functions/transaction.remote';
	import { formatTransactionDate } from '$lib/utils/format-transaction-date';
	import { CalendarDate, getLocalTimeZone, parseDate, today } from '@internationalized/date';
	import { Popover } from 'bits-ui';
	import { tick } from 'svelte';
	import PhPlus from '~icons/ph/plus';

	import ValidateCheckbox from './cells/validate-checkbox.svelte';

	let {
		budgetId,
		open = $bindable(false),
		to
	}: {
		budgetId: string;
		open?: boolean;
		to: string;
	} = $props();

	const categories = $derived(await getCategoriesFlat({ budgetId }));
	const budget = $derived(await getBudget({ budgetId }));
	const currency = $derived(budget.currency);

	let formEl = $state<HTMLFormElement | null>(null);
	let continueAfterSubmit = $state(false);

	$effect(() => {
		const accountId = page.params.accountId;
		if (accountId) createTransaction.fields.accountId.set(accountId);
	});

	$effect(() => {
		if (open && !createTransaction.fields.date.value()) {
			createTransaction.fields.date.set(today(getLocalTimeZone()).toString());
		}
	});

	let categoryOpen = $state(false);

	function getCategoryValue() {
		return createTransaction.fields.categoryId.value() ?? 'null';
	}

	function setCategoryValue(value: string) {
		createTransaction.fields.categoryId.set(value === 'null' ? undefined : value);
	}

	let dateOpen = $state(false);
	let dateTriggerRef = $state<HTMLButtonElement>(null!);

	function closeAndFocusDateTrigger() {
		dateOpen = false;
		tick().then(() => {
			dateTriggerRef.focus();
		});
	}

	function getDateValue() {
		const d = createTransaction.fields.date.value();
		return d ? parseDate(d) : today(getLocalTimeZone());
	}

	function setDateValue(newValue: CalendarDate) {
		createTransaction.fields.date.set(newValue.toString());
	}

	let amountInputRef = $state<HTMLInputElement>(null!);

	function submit() {
		continueAfterSubmit = false;
		formEl?.requestSubmit();
	}

	function submitAndContinue() {
		continueAfterSubmit = true;
		formEl?.requestSubmit();
	}

	function cancel() {
		open = false;
		createTransaction.fields.amount.set(0);
		createTransaction.fields.categoryId.set(undefined);
		createTransaction.fields.notes.set(undefined);
	}

	function onkeydown(ev: KeyboardEvent) {
		if (!open) return;
		if (ev.key === 'Enter') {
			return ev.shiftKey ? submitAndContinue() : submit();
		}
	}
</script>

<svelte:document {onkeydown} />

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button {...props} class="ml-auto w-fit">
				<PhPlus />
				{m.transactions_table_create_transaction()}
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Portal {to}>
		<Popover.ContentStatic class="contents">
			<form
				{...createTransaction.enhance(async (f) => {
					if (await f.submit()) {
						if (!continueAfterSubmit) {
							open = false;
						}
						createTransaction.fields.amount.set(0);
						createTransaction.fields.categoryId.set(undefined);
						createTransaction.fields.notes.set(undefined);
					}
				})}
				bind:this={formEl}
				class="contents"
			>
				<input {...createTransaction.fields.budgetId.as('hidden', budgetId)} />
				<input {...createTransaction.fields.accountId.as('hidden', page.params.accountId!)} />
				<input
					type="hidden"
					name={createTransaction.fields.date.as('text').name}
					value={createTransaction.fields.date.value() ?? ''}
				/>
				<input
					type="hidden"
					name={createTransaction.fields.categoryId.as('text').name}
					value={createTransaction.fields.categoryId.value() ?? ''}
				/>

				<div role="cell" class="flex size-full items-center bg-interactive/5 p-2">
					<SelectCommand
						bind:open={categoryOpen}
						bind:value={getCategoryValue, setCategoryValue}
						items={categories}
						textEmptyTrigger={m.transaction_table_cell_category_empty()}
						textInputPlaceholder={m.transaction_table_cell_category_placeholder()}
						textListEmpty={m.transaction_table_cell_category_empty()}
					/>
				</div>

				<div role="cell" class="flex size-full items-center bg-interactive/5 p-2">
					<Input
						name={createTransaction.fields.notes.as('text').name}
						bind:value={
							() => createTransaction.fields.notes.value() ?? '',
							(v) => createTransaction.fields.notes.set(v || undefined)
						}
					/>
				</div>

				<div role="cell" class="flex size-full items-center bg-interactive/5 p-2">
					<Popover.Root bind:open={dateOpen}>
						<Popover.Trigger bind:ref={dateTriggerRef}>
							{#snippet child({ props })}
								<Button
									{...props}
									variant="ghost"
									class="w-full justify-end border-muted/30 bg-surface/70 px-2 hover:cursor-text hover:bg-surface/70"
									role="combobox"
									aria-expanded={dateOpen}
								>
									{createTransaction.fields.date.value()
										? formatTransactionDate(parseDate(createTransaction.fields.date.value()!))
										: m.transaction_table_cell_date_select()}
								</Button>
							{/snippet}
						</Popover.Trigger>

						<Popover.Content
							class="w-full p-0"
							sideOffset={4}
							onkeydown={(ev) => {
								if (ev.key === 'Escape') {
									closeAndFocusDateTrigger();
									ev.stopPropagation();
								}
							}}
						>
							<Calendar
								type="single"
								bind:value={getDateValue, setDateValue}
								captionLayout="dropdown"
								onValueChange={() => {
									closeAndFocusDateTrigger();
								}}
								class="rounded-xl border border-muted/30 bg-surface-high shadow"
							/>
						</Popover.Content>
					</Popover.Root>
				</div>

				<div role="cell" class="flex size-full items-center bg-interactive/5 p-2">
					<InputCurrency
						bind:ref={amountInputRef}
						name={createTransaction.fields.amount.as('number').name}
						bind:value={
							() => createTransaction.fields.amount.value() ?? 0,
							(v) => createTransaction.fields.amount.set(v)
						}
						{currency}
						class="px-2 text-right font-medium"
					/>
				</div>

				<div role="cell" class="flex size-full items-center justify-center bg-interactive/5 p-2">
					<ValidateCheckbox
						bind:checked={
							() => createTransaction.fields.validated.value() ?? false,
							(v) => createTransaction.fields.validated.set(v === true)
						}
					/>
					<input
						type="hidden"
						name={createTransaction.fields.validated.as('checkbox').name}
						value={String(createTransaction.fields.validated.value() ?? false)}
					/>
				</div>

				<div
					role="cell"
					class="col-span-full flex items-center justify-end gap-2 bg-interactive/5 p-2"
				>
					<Button type="button" variant="ghost" onclick={() => cancel()}>
						{m.cancel()}
					</Button>

					<Button type="button" onclick={() => submit()}>{m.save()}</Button>

					<Button type="button" onclick={() => submitAndContinue()}>
						{m.save_and_continue()}
					</Button>
				</div>
			</form>
		</Popover.ContentStatic>
	</Popover.Portal>
</Popover.Root>
