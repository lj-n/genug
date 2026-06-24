/* eslint-disable svelte/prefer-svelte-reactivity */
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/state';
import { m } from '$lib/paraglide/messages';

import type { TransactionURLParams } from './utils';

import TableFilterCategory from './table-filter-category.svelte';
import TableFilterNotes from './table-filter-notes.svelte';

export type CategoryFilter = {
	active: boolean;
	type: 'category';
	value: string[];
};

export type FilterType = FilterState['type'];
export type NotesFilter = {
	active: boolean;
	type: 'notes';
	value: NonNullable<TransactionURLParams['notes']>;
};
type FilterState = CategoryFilter | NotesFilter;

export const FILTER_CONFIG = {
	category: {
		component: TableFilterCategory,
		defaultValue: [] as string[],
		description: m.transaction_filter_category_description,
		isEmpty: (v: string[]) => v.length === 0,
		label: m.transaction_filter_category_title,
		paramKey: 'categoryId' as const
	},
	notes: {
		component: TableFilterNotes,
		defaultValue: '' as string,
		description: m.transaction_filter_notes_description,
		isEmpty: (v: string) => !v,
		label: m.transaction_filter_notes_title,
		paramKey: 'notes' as const
	}
} as const;

export class TransactionFilter {
	items = $state<FilterState[]>([]);

	get allActive() {
		return this.items.every((f) => f.active);
	}

	get anyActive() {
		return this.items.some((f) => f.active);
	}

	get available() {
		return this.items.filter((f) => !f.active);
	}

	constructor(params: TransactionURLParams) {
		this.items = [
			{
				active: params.categoryId.length > 0,
				type: 'category',
				value: params.categoryId
			} as CategoryFilter,
			{ active: !!params.notes, type: 'notes', value: params.notes ?? '' } as NotesFilter
		];
	}

	add(type: FilterType) {
		const f = this.items.find((f) => f.type === type)!;
		f.active = true;
	}

	clearAll() {
		for (const f of this.items) {
			f.active = false;
			f.value = this.getConfig(f.type).defaultValue;
		}
		this.#go();
	}

	getConfig(type: FilterType) {
		return FILTER_CONFIG[type];
	}

	remove(type: FilterType) {
		const f = this.items.find((f) => f.type === type)!;
		f.active = false;
		if (f.type === 'category') (f.value as string[]) = [];
		else f.value = '';
		this.#setParam(type, undefined);
	}

	updateValue(type: FilterType, value: string | string[]) {
		const f = this.items.find((f) => f.type === type)!;
		(f.value as string | string[]) = value;
		this.#setParam(type, value);
	}

	#go(sp: URLSearchParams = new URLSearchParams()) {
		return goto(
			resolve(`/(app)/[budgetId=id]/accounts/[accountId=id]?${sp.toString()}`, {
				accountId: page.params.accountId!,
				budgetId: page.params.budgetId!
			}),
			{ keepFocus: true, noScroll: true }
		);
	}

	#setParam(type: FilterType, value: string | string[] | undefined) {
		const { paramKey } = FILTER_CONFIG[type];
		const sp = new URLSearchParams(page.url.searchParams);
		sp.delete(paramKey);
		sp.delete('page');

		if (value !== undefined && !(Array.isArray(value) && value.length === 0)) {
			if (Array.isArray(value)) {
				value.forEach((v) => sp.append(paramKey, v));
			} else {
				sp.set(paramKey, value);
			}
		}
		this.#go(sp);
	}
}
