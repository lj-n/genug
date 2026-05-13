import type { TransactionFilterParam } from '$db/actions/queries/transaction';
import type { Row } from '@tanstack/table-core';
import type { Infer, SuperForm } from 'sveltekit-superforms';

import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/state';
import { getContext, setContext } from 'svelte';

import type { schemaTransactionEdit } from '../../transactions/schema';
import type { PageData } from './$types';
import type { TransactionRow } from './types';

type Categories = PageData['categories'];
type EditingForm = SuperForm<Infer<typeof schemaTransactionEdit>>;

type TableContextParams = {
	categories: Categories;
	filter: TransactionFilterParam;
	form: EditingForm;
};

class TableContext {
	categories: Categories;
	editingRowId = $state<null | string>(null);
	filter: TransactionFilterParam;
	form: EditingForm;

	isEditingRow = $derived((rowId: string) => this.editingRowId === rowId);

	reloadTableWithParams = $derived(async () => {
		const { searchParams } = page.url;

		await goto(
			resolve(`/(app)/[budgetId=id]/accounts/[accountId=id]?${searchParams.toString()}`, {
				accountId: page.params.accountId!,
				budgetId: page.params.budgetId!
			}),
			{
				invalidateAll: true,
				noScroll: true
			}
		);
	});

	removeTableURLParams = $derived((key: string, value?: string) => {
		const { searchParams } = page.url;

		searchParams.delete(key, value);

		this.reloadTableWithParams();
	});

	setTableURLParams = $derived(async (key: string, value: string | string[]) => {
		const { searchParams } = page.url;

		searchParams.delete(key);

		if (Array.isArray(value)) {
			value.forEach((v) => {
				searchParams.append(key, v);
			});
		} else {
			searchParams.set(key, value);
		}

		searchParams.set('page', '1');

		this.reloadTableWithParams();
	});

	constructor({ categories, filter, form }: TableContextParams) {
		this.categories = $state(categories);
		this.form = form;
		this.filter = filter;
	}

	cancelEdit = () => {
		this.editingRowId = null;
		this.form.reset();
	};

	setEditingRow = (row: Row<TransactionRow>) => {
		this.cancelEdit();
		this.editingRowId = row.id;
		this.form.reset({
			data: {
				accountId: row.original.accountId,
				amount: row.original.amount,
				categoryId: row.original.categoryId,
				date: row.original.date,
				notes: row.original.notes,
				transactionId: row.original.id,
				validated: row.original.validated
			}
		});
	};
}

const TABLE_CONTEXT_KEY = Symbol('TableContext');

export function getTableContext() {
	return getContext<ReturnType<typeof setTableContext>>(TABLE_CONTEXT_KEY);
}

export function setTableContext(params: TableContextParams) {
	return setContext(TABLE_CONTEXT_KEY, new TableContext(params));
}
