import type {
	TransactionFilterParam,
	TransactionPaginationParam
} from '$db/actions/queries/transaction';
import type { schemaTransactionEdit } from '$lib/schemas/transactions';
import type { Infer, SuperForm } from 'sveltekit-superforms';

import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/state';
import { type Component, createContext, type Snippet } from 'svelte';
import { SvelteURLSearchParams } from 'svelte/reactivity';

import type { CategoryItem, TransactionRow } from './types';

import FilterCategory from './filter/filter-category.svelte';
import FilterNotes from './filter/filter-notes.svelte';

const FILTER_KEYS = [
	'accountId',
	'categoryId',
	'fromDate',
	'maxAmount',
	'minAmount',
	'notes',
	'toDate',
	'validated'
] satisfies (keyof TransactionFilterParam)[];

export type FilterComponent = Component<{
	footer: Snippet<[{ setParams: () => void }]>;
	header: Snippet<[{ description: string; title: string }]>;
}>;

type EditForm = SuperForm<Infer<typeof schemaTransactionEdit>>;
type Filter = TransactionFilterParam;
type FilterComponentState = { Component: FilterComponent };
type FilterDialogType = 'amount' | 'category' | 'date' | 'notes' | 'validated';
type Pagination = TransactionPaginationParam;

const FILTER_DIALOG_MAP: Partial<Record<FilterDialogType, FilterComponent>> = {
	category: FilterCategory,
	notes: FilterNotes
};

export class TableContext {
	private editingRowId = $state<null | string>(null);
	public editing = $derived(this.editingRowId !== null);
	public filterComponent = $state<FilterComponentState | null>(null);

	public filterDialogOpen = $state(false);

	public get editFormAction() {
		return resolve('/(app)/[budgetId=id]/transactions', { budgetId: this.budgetId });
	}

	constructor(
		public categories: () => CategoryItem[],
		public editForm: EditForm,
		public filter: () => Filter,
		public pagination: () => Pagination,
		public transactions: () => TransactionRow[],
		private accountId: string,
		private budgetId: string
	) {}

	public cancelEditing() {
		this.editingRowId = null;
		this.editForm.reset();
	}

	public clearAllFilters() {
		const searchParams = new SvelteURLSearchParams(page.url.searchParams);
		FILTER_KEYS.forEach((key) => searchParams.delete(key));
		searchParams.delete('page');
		return this.navigate(searchParams);
	}

	public getTransactionById(id: string) {
		return this.transactions().find((f) => f.id === id);
	}

	public isEditingRow(rowId: string) {
		return this.editingRowId === rowId;
	}

	public openFilterDialog(type: FilterDialogType) {
		const Component = FILTER_DIALOG_MAP[type];
		if (Component) this.filterComponent = { Component };
		this.filterDialogOpen = true;
	}

	public removeFilterParams(key: keyof TransactionFilterParam, value?: string) {
		const searchParams = new SvelteURLSearchParams(page.url.searchParams);
		searchParams.delete(key, value);
		searchParams.delete('page');
		return this.navigate(searchParams);
	}

	public setEditingRow(rowId: string) {
		const transaction = this.getTransactionById(rowId);

		if (transaction) {
			this.editingRowId = rowId;

			const { id: transactionId, ...rest } = transaction;
			this.editForm.reset({ data: { transactionId, ...rest } });
		}
	}

	public setFilterParams(params: TransactionFilterParam) {
		const searchParams = new SvelteURLSearchParams(page.url.searchParams);

		for (const key of Object.keys(params)) {
			searchParams.delete(key);
		}

		searchParams.delete('page');

		for (const [key, value] of Object.entries(params)) {
			if (value === undefined) continue;
			if (Array.isArray(value)) {
				value.forEach((v) => searchParams.append(key, v));
			} else {
				searchParams.set(key, value.toString());
			}
		}

		return this.navigate(searchParams);
	}

	public setPaginationParam(param: 'page' | 'pageSize', value: string) {
		const searchParams = new SvelteURLSearchParams(page.url.searchParams);
		searchParams.set(param, value);
		return this.navigate(searchParams);
	}

	private navigate(searchParams: URLSearchParams) {
		return goto(
			resolve(`/(app)/[budgetId=id]/accounts/[accountId=id]?${searchParams.toString()}`, {
				accountId: this.accountId,
				budgetId: this.budgetId
			}),
			{ keepFocus: true, noScroll: true }
		);
	}
}

export const [getTableContext, setTableContext] = createContext<TableContext>();
