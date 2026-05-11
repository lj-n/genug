<script lang="ts">
	import type { Row } from '@tanstack/table-core';

	import { Button } from '$lib/components/ui/button';
	import { Calendar } from '$lib/components/ui/calendar';
	import * as Form from '$lib/components/ui/form';
	import { getIntlContext } from '$lib/utils/intl-context.svelte';
	import { type CalendarDate, parseDate } from '@internationalized/date';
	import { Popover } from 'bits-ui';
	import { tick } from 'svelte';

	import type { TransactionRow } from './types';

	import { getTableContext } from './table-context.svelte';

	let { date, row }: { date: string; row: Row<TransactionRow> } = $props();

	const tableContext = getTableContext();
	const intlContext = getIntlContext();

	const { form: formData } = tableContext.form;

	function editCell() {
		tableContext.setEditingRow(row);
	}

	let df = $derived((date: CalendarDate) =>
		intlContext.formatDate(date, {
			day: '2-digit',
			month: 'short',
			year: '2-digit'
		})
	);

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

<div class="grid size-full items-center justify-items-end">
	{#if tableContext.isEditingRow(row.id)}
		<Form.Field form={tableContext.form} name="notes" class="w-full space-y-0">
			<Form.Control>
				{#snippet children({ props: triggerProps })}
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
									{$formData.date ? df(parseDate($formData.date)) : 'Select date'}
									<!-- <PhCaretUpDown class="opacity-50" /> -->
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
			</Form.Control>
		</Form.Field>
	{:else}
		<button
			class="flex size-full items-center justify-end truncate border border-transparent px-2"
			onclick={editCell}
		>
			{date ? df(parseDate(date)) : ''}
		</button>
	{/if}
</div>
