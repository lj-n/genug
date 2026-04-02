import type { Actions } from '$db/actions';
import type { ColumnDef } from '@tanstack/table-core';

type Row = Awaited<ReturnType<Actions['budget']['month']>>[number];

export const columns: ColumnDef<Row>[] = [
	{
		accessorKey: 'name',
		header: 'Name'
	},
	{
		accessorKey: 'thisMonthAmount',
		header: 'Amount'
	},
	{
		accessorKey: 'thisMonthActivity',
		header: 'Activity'
	},
	{
		accessorKey: 'thisMonthRemaining',
		header: 'Remaining'
	}
];
