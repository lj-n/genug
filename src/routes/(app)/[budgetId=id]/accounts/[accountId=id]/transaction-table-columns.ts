import type { ColumnDef } from '@tanstack/table-core';

import { renderComponent } from '$lib/components/ui/data-table';
import { m } from '$lib/paraglide/messages';

import type { TransactionRow } from './types';

import TableCellAmount from './table-cell-amount.svelte';
import TableCellCategory from './table-cell-category.svelte';
import TableCellDate from './table-cell-date.svelte';
import TableCellNotes from './table-cell-notes.svelte';
import TableCellSelection from './table-cell-selection.svelte';
import TableCellValidated from './table-cell-validated.svelte';
import ValidateCheckbox from './validate-checkbox.svelte';

export const columns: ColumnDef<TransactionRow>[] = [
	{
		cell: ({ row }) =>
			renderComponent(TableCellSelection, {
				checked: row.getIsSelected(),
				onCheckedChange: (value) => row.toggleSelected(!!value)
			}),
		header: ({ table }) =>
			renderComponent(TableCellSelection, {
				'aria-label': m.transactions_table_select_all(),
				checked: table.getIsAllPageRowsSelected(),
				indeterminate: table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected(),
				onCheckedChange: (value) => table.toggleAllPageRowsSelected(!!value)
			}),
		id: 'selection'
	},
	{
		accessorKey: 'categoryName',
		cell: (ctx) =>
			renderComponent(TableCellCategory, {
				categoryName: ctx.getValue() as string,
				row: ctx.row
			}),
		header: m.transactions_table_header_category(),
		id: 'categoryName'
	},
	{
		accessorKey: 'notes',
		cell: ({ getValue, row }) =>
			renderComponent(TableCellNotes, { notes: getValue() as string, row }),
		header: m.transactions_table_header_notes(),
		id: 'notes'
	},
	{
		accessorKey: 'date',
		cell: ({ getValue, row }) =>
			renderComponent(TableCellDate, { date: getValue() as string, row }),
		header: m.transactions_table_header_date(),
		id: 'date'
	},
	{
		accessorKey: 'amount',
		cell: ({ getValue, row }) =>
			renderComponent(TableCellAmount, { amount: getValue() as number, row }),
		header: m.transactions_table_header_amount(),
		id: 'amount'
	},
	{
		accessorKey: 'validated',
		cell: ({ getValue, row }) =>
			renderComponent(TableCellValidated, { isValidated: getValue() as boolean, row }),
		header: () => renderComponent(ValidateCheckbox, { checked: true, disabled: true }),
		id: 'validated'
	}
];
