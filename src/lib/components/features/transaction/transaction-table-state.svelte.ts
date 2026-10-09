import type { TransactionsURLParams } from '$lib/schemas/transaction';

import {
	type CategoryFilter,
	type FilterType,
	TransactionFilter
} from './transaction-filter.svelte';
import {
	type Sort,
	type SortColumn,
	type SortDirection,
	sortFromParams,
	TransactionSort
} from './transaction-sort.svelte';

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

		return tableParams({
			categoryId: category.active ? category.value : [],
			notes: notes.active ? (notes.value as string) : undefined,
			page: this.#page,
			pageSize: this.#pageSize,
			sort: this.sort
		});
	}

	#page = $state(1);

	#pageSize = $state(15);

	constructor(params: TransactionsURLParams) {
		this.filter = new TransactionFilter(params);
		this.sort = new TransactionSort(params);
		this.reset(params);
	}

	clearAllFilters() {
		this.filter.clearAll();
		this.#page = 1;
	}

	clearFilter(type: FilterType) {
		this.filter.remove(type);
		this.#page = 1;
	}

	/** Replaces filter, sort and pagination in place; the instances stay the same. */
	reset(params: TransactionsURLParams) {
		this.filter.reset(params);
		this.sort.reset(params);
		this.#page = params.page;
		this.#pageSize = params.pageSize;
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
}

/** The params a `TableState` freshly built from these URL params would expose. */
export function toTableParams(params: TransactionsURLParams): TableParams {
	return tableParams({ ...params, sort: sortFromParams(params) });
}

function tableParams({
	categoryId,
	notes,
	page,
	pageSize,
	sort
}: Pick<TransactionsURLParams, 'categoryId' | 'notes' | 'page' | 'pageSize'> & {
	sort: Sort;
}): TableParams {
	const direction = (column: SortColumn) =>
		sort.column === column ? (sort.direction ?? undefined) : undefined;
	return {
		categoryId,
		notes: notes || undefined,
		page,
		pageSize,
		sortAmount: direction('amount'),
		sortCategory: direction('category'),
		sortDate: direction('date'),
		sortValidated: direction('validated')
	};
}
