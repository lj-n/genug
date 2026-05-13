import type { TransactionFilterParam } from '$db/actions/queries/transaction';
import type { Infer, SuperForm } from 'sveltekit-superforms';

import { type Component, createContext, type Snippet } from 'svelte';

import type { schemaTransactionEdit } from '../../transactions/schema';
import type { PageData } from './$types';
import type { TransactionRow } from './types';

import FilterCategory from './filter-category.svelte';
import FilterNotes from './filter-notes.svelte';

export type FilterComponent = Component<{
	footer: Snippet<
		[
			{
				setParams: () => void;
			}
		]
	>;

	header: Snippet<
		[
			{
				description: string;
				title: string;
			}
		]
	>;
}>;
type Category = PageData['categories'][number];
type EditForm = SuperForm<Infer<typeof schemaTransactionEdit>>;
type Filter = TransactionFilterParam;
type FilterComponentState = { Component: FilterComponent };
type FilterDialogType = 'category' | 'notes';
type Transaction = TransactionRow;

export class TableContext {
	private editingRowId = $state<null | string>(null);

	public editing = $derived(this.editingRowId !== null);
	public filterComponent = $state<FilterComponentState | null>(null);
	public filterDialogOpen = $state(false);

	constructor(
		public categories: () => Category[],
		public editForm: () => EditForm,
		public filter: () => Filter,
		public transactions: () => Transaction[]
	) {}

	public cancelEditing() {
		this.editingRowId = null;
		this.editForm().reset();
	}

	public getTransactionById(id: string) {
		return this.transactions().find((f) => f.id === id);
	}

	public isEditingRow(rowId: string) {
		return this.editingRowId === rowId;
	}

	public openFilterDialog(type: FilterDialogType) {
		switch (type) {
			case 'category': {
				this.filterComponent = {
					Component: FilterCategory
				};
				break;
			}

			case 'notes': {
				this.filterComponent = {
					Component: FilterNotes
				};
				break;
			}
		}

		this.filterDialogOpen = true;
	}

	public setEditingRow(rowId: string) {
		const transaction = this.getTransactionById(rowId);

		if (transaction) {
			this.editingRowId = rowId;

			const { id: transactionId, ...rest } = transaction;
			this.editForm().reset({ data: { transactionId, ...rest } });
		}
	}
}

export const [getTableContext, setTableContext] = createContext<TableContext>();
