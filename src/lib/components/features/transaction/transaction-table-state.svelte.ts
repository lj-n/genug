import type { TransactionsURLParams } from '$lib/schemas/transaction';

import {
	type CategoryFilter,
	type FilterType,
	TransactionFilter
} from './transaction-filter.svelte';
import { type SortColumn, type SortDirection, TransactionSort } from './transaction-sort.svelte';

export type TableParams = {
	categoryId: string[];
	notes: string | undefined;
	page: number;
	pageSize: number;
	sortAmount: SortDirection | undefined;
	sortCategory: SortDirection | undefined;
	sortDate: SortDirection | undefined;
	sortValidated: SortDirection | undefined;
};

export class TableState {
	readonly filter: TransactionFilter;
	readonly sort: TransactionSort;
	get page() {
		return this.#page;
	}
	get pageSize() {
		return this.#pageSize;
	}

	get params(): TableParams {
		const category = this.filter.items.find((f): f is CategoryFilter => f.type === 'category')!;
		const notes = this.filter.items.find((f) => f.type === 'notes')!;

		return {
			categoryId: category.active ? category.value : [],
			notes: notes.active && notes.value ? (notes.value as string) : undefined,
			page: this.#page,
			pageSize: this.#pageSize,
			sortAmount: this.#sortDirection('amount'),
			sortCategory: this.#sortDirection('category'),
			sortDate: this.#sortDirection('date'),
			sortValidated: this.#sortDirection('validated')
		};
	}

	#page = $state(1);

	#pageSize = $state(15);

	constructor(params: TransactionsURLParams) {
		this.filter = new TransactionFilter(params);
		this.sort = new TransactionSort(params);
		this.#page = params.page;
		this.#pageSize = params.pageSize;
	}

	clearAllFilters() {
		this.filter.clearAll();
		this.#page = 1;
	}

	clearFilter(type: FilterType) {
		this.filter.remove(type);
		this.#page = 1;
	}

	setFilter(type: FilterType, value: string | string[]) {
		this.filter.add(type);
		this.filter.updateValue(type, value);
		this.#page = 1;
	}

	setPage(page: number) {
		this.#page = page;
	}

	setPageSize(pageSize: number) {
		this.#pageSize = pageSize;
		this.#page = 1;
	}

	toggleSort(column: SortColumn) {
		this.sort.toggle(column);
		this.#page = 1;
	}

	#sortDirection(column: SortColumn) {
		return this.sort.column === column ? (this.sort.direction ?? undefined) : undefined;
	}
}
