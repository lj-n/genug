import type { ColumnDef } from '@tanstack/table-core';

import { renderComponent } from '$lib/components/ui/data-table';
import { m } from '$lib/paraglide/messages';

import type { TransactionRow } from './types';

import CellAmount from './cells/cell-amount.svelte';
import CellCategory from './cells/cell-category.svelte';
import CellDate from './cells/cell-date.svelte';
import CellNotes from './cells/cell-notes.svelte';
import CellSelection from './cells/cell-selection.svelte';
import CellValidated from './cells/cell-validated.svelte';
import ValidateCheckbox from './cells/validate-checkbox.svelte';

export const columns: ColumnDef<TransactionRow>[] = [
	{
		cell: ({ row }) =>
			renderComponent(CellSelection, {
				checked: row.getIsSelected(),
				onCheckedChange: (value: 'indeterminate' | boolean) => row.toggleSelected(!!value)
			}),
		header: ({ table }) =>
			renderComponent(CellSelection, {
				'aria-label': m.transactions_table_select_all(),
				checked: table.getIsAllPageRowsSelected(),
				indeterminate: table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected(),
				onCheckedChange: (value: 'indeterminate' | boolean) =>
					table.toggleAllPageRowsSelected(!!value)
			}),
		id: 'selection'
	},
	{
		accessorKey: 'categoryName',
		cell: (ctx) =>
			renderComponent(CellCategory, {
				categoryName: ctx.getValue() as string,
				row: ctx.row
			}),
		header: m.transactions_table_header_category(),
		id: 'categoryName'
	},
	{
		accessorKey: 'notes',
		cell: ({ getValue, row }) => renderComponent(CellNotes, { notes: getValue() as string, row }),
		header: m.transactions_table_header_notes(),
		id: 'notes'
	},
	{
		accessorKey: 'date',
		cell: ({ getValue, row }) => renderComponent(CellDate, { date: getValue() as string, row }),
		header: m.transactions_table_header_date(),
		id: 'date'
	},
	{
		accessorKey: 'amount',
		cell: ({ getValue, row }) => renderComponent(CellAmount, { amount: getValue() as number, row }),
		header: m.transactions_table_header_amount(),
		id: 'amount'
	},
	{
		accessorKey: 'validated',
		cell: ({ getValue, row }) =>
			renderComponent(CellValidated, { isValidated: getValue() as boolean, row }),
		header: () => renderComponent(ValidateCheckbox, { checked: true, disabled: true }),
		id: 'validated'
	}
];
