import type { TransactionsURLParams } from '$lib/schemas/transaction';

export type SortColumn = 'amount' | 'category' | 'date' | 'validated';
export type SortDirection = 'asc' | 'desc';

export class TransactionSort {
	column = $state<null | SortColumn>(null);
	direction = $state<null | SortDirection>(null);

	constructor(params: TransactionsURLParams) {
		if (params.sortDate) {
			this.column = 'date';
			this.direction = params.sortDate;
		} else if (params.sortCategory) {
			this.column = 'category';
			this.direction = params.sortCategory;
		} else if (params.sortAmount) {
			this.column = 'amount';
			this.direction = params.sortAmount;
		} else if (params.sortValidated) {
			this.column = 'validated';
			this.direction = params.sortValidated;
		}
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
