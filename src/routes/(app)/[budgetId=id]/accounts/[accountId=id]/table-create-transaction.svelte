<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { Calendar } from '$lib/components/ui/calendar';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { InputCurrency } from '$lib/components/ui/input-currency';
	import { SelectCommand } from '$lib/components/ui/select-command';
	import { m } from '$lib/paraglide/messages';
	import { getIntlContext } from '$lib/utils/intl-context.svelte';
	import { CalendarDate, parseDate } from '@internationalized/date';
	import { Popover } from 'bits-ui';
	import { type Snippet, tick, untrack } from 'svelte';
	import { type Infer, superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { cn } from 'tailwind-variants';
	import PhFilePlus from '~icons/ph/file-plus';

	import type { PageData } from './$types';

	import { schemaTransactionCreate } from '../../transactions/new/schema';
	import ValidateCheckbox from './validate-checkbox.svelte';

	let {
		categories,
		form: createForm,
		open = $bindable(false),
		to
	}: {
		categories: PageData['categories'];
		form: SuperValidated<Infer<typeof schemaTransactionCreate>>;
		open?: boolean;
		to: string;
	} = $props();

	type FieldName = keyof Infer<typeof schemaTransactionCreate>;

	const form = superForm(
		untrack(() => createForm),
		{
			validators: zod4Client(schemaTransactionCreate)
		}
	);

	$effect(() => {
		$formData.accountId = page.params.accountId!;
	});

	const { enhance, errors, form: formData } = form;

	const intlContext = getIntlContext();

	let categoryOpen = $state(false);

	function getCategoryValue() {
		return $formData.categoryId ?? 'null';
	}

	function setCategoryValue(value: string) {
		$formData.categoryId = value === 'null' ? null : value;
	}

	let df = $derived((date: CalendarDate) =>
		intlContext.formatDate(date, {
			day: '2-digit',
			month: 'short',
			year: '2-digit'
		})
	);

	let dateOpen = $state(false);
	let dateTriggerRef = $state<HTMLButtonElement>(null!);

	function closeAndFocusDateTrigger() {
		dateOpen = false;
		tick().then(() => {
			dateTriggerRef.focus();
		});
	}

	function getDateValue() {
		return parseDate($formData.date);
	}

	function setDateValue(newValue: CalendarDate) {
		$formData.date = newValue.toString();
	}

	let amountInputRef = $state<HTMLInputElement>(null!);
</script>

{#snippet cell({
	edit,
	name
}: {
	edit: Snippet<[{ props: Record<string, unknown> }]>;
	name: FieldName;
})}
	<div role="cell" class={cn('flex size-full items-center bg-interactive/2 p-2')}>
		<Form.Field {form} {name} class="w-full space-y-0">
			<Form.Control>
				{#snippet children({ props })}
					{@render edit({ props })}
				{/snippet}
			</Form.Control>
		</Form.Field>
	</div>
{/snippet}

{#snippet category({ props }: { props: Record<string, unknown> })}
	<SelectCommand
		bind:open={categoryOpen}
		bind:value={getCategoryValue, setCategoryValue}
		items={categories}
		textEmptyTrigger={m.transaction_table_cell_category_empty()}
		textInputPlaceholder={m.transaction_table_cell_category_placeholder()}
		textListEmpty={m.transaction_table_cell_category_empty()}
		{...props}
	/>
{/snippet}

{#snippet notes({ props }: { props: Record<string, unknown> })}
	<Input bind:value={$formData.notes} {...props} />
{/snippet}

{#snippet date({ props: triggerProps }: { props: Record<string, unknown> })}
	<Popover.Root bind:open={dateOpen}>
		<Popover.Trigger bind:ref={dateTriggerRef} {...triggerProps}>
			{#snippet child({ props })}
				<Button
					{...props}
					variant="ghost"
					class="w-full justify-end border-muted/30 bg-surface/70 px-2 hover:cursor-text hover:bg-surface/70"
					role="combobox"
					aria-expanded={open}
				>
					{$formData.date ? df(parseDate($formData.date)) : m.transaction_table_cell_date_select()}
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
				locale={intlContext.locale}
				captionLayout="dropdown"
				onValueChange={() => {
					closeAndFocusDateTrigger();
				}}
				class="rounded-xl border border-muted/30 bg-surface-high shadow"
			/>
		</Popover.Content>
	</Popover.Root>
{/snippet}

{#snippet amount({ props }: { props: Record<string, unknown> })}
	<InputCurrency
		bind:ref={amountInputRef}
		bind:value={$formData.amount}
		{...props}
		intlConfig={{ locale: intlContext.locale, ...intlContext.numberFormatOptions }}
		class="px-2 text-right font-medium"
	/>
{/snippet}

{#snippet validated({ props }: { props: Record<string, unknown> })}
	<ValidateCheckbox bind:checked={$formData.validated} {...props} />
{/snippet}

<pre>{JSON.stringify({ data: $formData, errors: $errors }, null, 2)}</pre>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button {...props}>
				<PhFilePlus />
				Create Transaction
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Portal {to}>
		<Popover.ContentStatic class="contents">
			<form
				action={resolve('/(app)/[budgetId=id]/transactions/new', {
					budgetId: page.params.budgetId!
				})}
				use:enhance
				class="contents"
				method="POST"
			>
				<input type="hidden" name="accountId" value={page.params.accountId} />
				<input type="hidden" name="date" bind:value={$formData.date} />
				<input type="hidden" name="categoryId" bind:value={$formData.categoryId} />
				{@render cell({ edit: category, name: 'categoryId' })}
				{@render cell({ edit: notes, name: 'notes' })}
				{@render cell({ edit: date, name: 'date' })}
				{@render cell({ edit: amount, name: 'amount' })}
				{@render cell({ edit: validated, name: 'validated' })}

				<div
					role="cell"
					class="col-span-full flex items-center justify-end gap-2 bg-interactive/2 p-2"
				>
					<Form.Button type="button" variant="ghost">{m.cancel()}</Form.Button>
					<Form.Button>{m.save()}</Form.Button>
				</div>
			</form>
		</Popover.ContentStatic>
	</Popover.Portal>
</Popover.Root>
