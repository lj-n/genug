import type { TransactionsURLParams } from '$lib/schemas/transaction';

import { m } from '$lib/paraglide/messages';

export type CategoryFilter = {
	active: boolean;
	type: 'category';
	value: string[];
};

export type FilterType = FilterState['type'];
export type NotesFilter = {
	active: boolean;
	type: 'notes';
	value: NonNullable<TransactionsURLParams['notes']>;
};
type FilterState = CategoryFilter | NotesFilter;

export const FILTER_CONFIG = {
	category: {
		defaultValue: [] as string[],
		description: m.transaction_filter_category_description,
		isEmpty: (v: string[]) => v.length === 0,
		label: m.transaction_filter_category_title,
		paramKey: 'categoryId' as const
	},
	notes: {
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

	constructor(params: TransactionsURLParams) {
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
	}

	getConfig(type: FilterType) {
		return FILTER_CONFIG[type];
	}

	remove(type: FilterType) {
		const f = this.items.find((f) => f.type === type)!;
		f.active = false;
		if (f.type === 'category') (f.value as string[]) = [];
		else f.value = '';
	}

	updateValue(type: FilterType, value: string | string[]) {
		const f = this.items.find((f) => f.type === type)!;
		(f.value as string | string[]) = value;
	}
}
