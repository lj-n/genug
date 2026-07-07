/* eslint-disable svelte/prefer-svelte-reactivity */
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/state';

import type { TransactionURLParams } from './utils';

export type SortColumn = 'amount' | 'category' | 'date' | 'validated';
export type SortDirection = 'asc' | 'desc';

const PARAM_KEYS: Record<SortColumn, string> = {
	amount: 'sortAmount',
	category: 'sortCategory',
	date: 'sortDate',
	validated: 'sortValidated'
};

export class TransactionSort {
	column = $state<null | SortColumn>(null);
	direction = $state<null | SortDirection>(null);

	constructor(params: TransactionURLParams) {
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
		this.#go();
	}

	#go() {
		const sp = new URLSearchParams(page.url.searchParams);
		for (const key of Object.values(PARAM_KEYS)) {
			sp.delete(key);
		}
		sp.delete('page');

		if (this.column && this.direction) {
			sp.set(this.#paramKey(this.column), this.direction);
		}

		return goto(
			resolve(`/(app)/[budgetId=id]/accounts/[accountId=id]?${sp.toString()}`, {
				accountId: page.params.accountId!,
				budgetId: page.params.budgetId!
			}),
			{ keepFocus: true, noScroll: true }
		);
	}

	#paramKey(column: SortColumn) {
		return PARAM_KEYS[column];
	}
}
