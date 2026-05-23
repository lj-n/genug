<script lang="ts">
	import type { Row } from '@tanstack/table-core';

	import { Button } from '$lib/components/ui/button';
	import { Calendar } from '$lib/components/ui/calendar';
	import { m } from '$lib/paraglide/messages';
	import { formatTransactionDate } from '$lib/utils/format-transaction-date';
	import { getIntlContext } from '$lib/utils/intl-context.svelte';
	import { type CalendarDate, parseDate } from '@internationalized/date';
	import { Popover } from 'bits-ui';
	import { tick } from 'svelte';

	import type { TransactionRow } from '../types';

	import { getTableContext } from '../context.svelte';
	import CellEditable from './cell-editable.svelte';

	let { date, row }: { date: string; row: Row<TransactionRow> } = $props();

	const tableContext = getTableContext();
	const intlContext = getIntlContext();

	const { form: formData } = tableContext.editForm;

	let open = $state(false);
	let triggerRef = $state<HTMLButtonElement>(null!);

	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}

	function getValue() {
		return $formData.date ? parseDate($formData.date) : parseDate(date);
	}

	function setValue(newValue: CalendarDate) {
		$formData.date = newValue.toString();
	}
</script>

<CellEditable
	{row}
	name="date"
	align="end"
	ariaLabel={m.transactions_table_edit_date()}
	buttonClass="truncate"
>
	{#snippet view()}
		{date ? formatTransactionDate(intlContext, parseDate(date)) : ''}
	{/snippet}
	{#snippet edit({ props: triggerProps })}
		<Popover.Root bind:open>
			<Popover.Trigger bind:ref={triggerRef} {...triggerProps}>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="ghost"
						class="w-full justify-end border-muted/30 bg-surface/70 px-2 hover:cursor-text hover:bg-surface/70"
						role="combobox"
						aria-expanded={open}
					>
						{$formData.date
							? formatTransactionDate(intlContext, parseDate($formData.date))
							: m.transaction_table_cell_date_select()}
					</Button>
				{/snippet}
			</Popover.Trigger>

			<Popover.Content
				class="w-full p-0"
				sideOffset={4}
				onkeydown={(ev) => {
					if (ev.key === 'Escape') {
						closeAndFocusTrigger();
						ev.stopPropagation();
					}
				}}
			>
				<Calendar
					type="single"
					bind:value={getValue, setValue}
					locale={intlContext.locale}
					captionLayout="dropdown"
					onValueChange={() => {
						closeAndFocusTrigger();
					}}
					class="rounded-xl border border-muted/30 bg-surface-high shadow"
				/>
			</Popover.Content>
		</Popover.Root>
	{/snippet}
</CellEditable>
