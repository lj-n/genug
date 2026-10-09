import type { TransactionsURLParams } from '$lib/schemas/transaction';

export type SortColumn = 'amount' | 'category' | 'date' | 'validated';
export type SortDirection = 'asc' | 'desc';

export class TransactionSort {
	column = $state<null | SortColumn>(null);
	direction = $state<null | SortDirection>(null);

	constructor(params: TransactionsURLParams) {
		this.reset(params);
	}

	reset(params: TransactionsURLParams) {
		({ column: this.column, direction: this.direction } = sortFromParams(params));
	}

	toggle(column: SortColumn) {
		if (this.column !== column) {
			this.column = column;
			this.direction = 'asc';
		} else if (this.direction === 'asc') {
			this.direction = 'desc';
		} else if (this.direction === 'desc') {
			this.column = null;
			this.direction = null;
		}
	}
}

/** The one sort the URL params select; earlier columns win when several are set. */
export function sortFromParams(params: TransactionsURLParams): {
	column: null | SortColumn;
	direction: null | SortDirection;
} {
	if (params.sortDate) return { column: 'date', direction: params.sortDate };
	if (params.sortCategory) return { column: 'category', direction: params.sortCategory };
	if (params.sortAmount) return { column: 'amount', direction: params.sortAmount };
	if (params.sortValidated) return { column: 'validated', direction: params.sortValidated };
	return { column: null, direction: null };
}
