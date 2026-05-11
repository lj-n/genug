import type { Row } from '@tanstack/table-core';
import type { Infer, SuperForm } from 'sveltekit-superforms';

import { getContext, setContext } from 'svelte';

import type { schemaTransactionEdit } from '../../transactions/schema';
import type { PageData } from './$types';
import type { TransactionRow } from './types';

type Categories = PageData['categories'];
type EditingForm = SuperForm<Infer<typeof schemaTransactionEdit>>;

type TableContextParams = {
	categories: Categories;
	form: EditingForm;
};

class TableContext {
	categories: Categories;
	editingRowId = $state<null | string>(null);
	form: EditingForm;

	isEditingRow = $derived((rowId: string) => this.editingRowId === rowId);

	constructor({ categories, form }: TableContextParams) {
		this.categories = $state(categories);
		this.form = form;
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
