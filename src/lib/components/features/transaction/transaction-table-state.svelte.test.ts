import { TransactionsURLParamsSchema } from '$lib/schemas/transaction';
import { parse } from 'valibot';
import { describe, expect, it } from 'vitest';

import { TableState } from './transaction-table-state.svelte';

function params(input: Record<string, unknown> = {}) {
	return parse(TransactionsURLParamsSchema, input);
}

describe('TableState', () => {
	it('hydrates filter, sort, page and pageSize from params', () => {
		const state = new TableState(
			params({
				categoryId: ['cat-1'],
				notes: 'rent',
				page: '3',
				pageSize: '50',
				sortAmount: 'desc'
			})
		);

		expect(state.page).toBe(3);
		expect(state.pageSize).toBe(50);
		expect(state.filter.items).toContainEqual({ active: true, type: 'notes', value: 'rent' });
		expect(state.sort.column).toBe('amount');
		expect(state.sort.direction).toBe('desc');
	});

	it('exposes defaults when params are empty', () => {
		const state = new TableState(params());

		expect(state.params).toEqual({
			categoryId: [],
			notes: undefined,
			page: 1,
			pageSize: 15,
			sortAmount: undefined,
			sortCategory: undefined,
			sortDate: undefined,
			sortValidated: undefined
		});
	});

	it('params reflects active filters, sort and pagination', () => {
		const state = new TableState(
			params({
				categoryId: ['cat-1', 'cat-2'],
				notes: 'rent',
				page: '2',
				pageSize: '25',
				sortDate: 'asc'
			})
		);

		expect(state.params).toEqual({
			categoryId: ['cat-1', 'cat-2'],
			notes: 'rent',
			page: 2,
			pageSize: 25,
			sortAmount: undefined,
			sortCategory: undefined,
			sortDate: 'asc',
			sortValidated: undefined
		});
	});

	it('setFilter activates the filter, sets its value and resets the page', () => {
		const state = new TableState(params({ page: '4' }));

		state.setFilter('category', ['cat-1']);

		expect(state.filter.items).toContainEqual({
			active: true,
			type: 'category',
			value: ['cat-1']
		});
		expect(state.page).toBe(1);
		expect(state.params.categoryId).toEqual(['cat-1']);
	});

	it('clearFilter deactivates the filter and resets the page', () => {
		const state = new TableState(params({ notes: 'rent', page: '4' }));

		state.clearFilter('notes');

		expect(state.filter.items).toContainEqual({ active: false, type: 'notes', value: '' });
		expect(state.page).toBe(1);
		expect(state.params.notes).toBeUndefined();
	});

	it('clearAllFilters deactivates every filter and resets the page', () => {
		const state = new TableState(params({ categoryId: ['cat-1'], notes: 'rent', page: '4' }));

		state.clearAllFilters();

		expect(state.filter.anyActive).toBe(false);
		expect(state.page).toBe(1);
		expect(state.params.categoryId).toEqual([]);
		expect(state.params.notes).toBeUndefined();
	});

	it('toggleSort cycles the direction and resets the page', () => {
		const state = new TableState(params({ page: '4' }));

		state.toggleSort('date');

		expect(state.params.sortDate).toBe('asc');
		expect(state.page).toBe(1);

		state.setPage(4);
		state.toggleSort('date');

		expect(state.params.sortDate).toBe('desc');
		expect(state.page).toBe(1);

		state.toggleSort('date');

		expect(state.params.sortDate).toBeUndefined();
	});

	it('toggleSort on another column switches to it with direction asc', () => {
		const state = new TableState(params({ sortDate: 'desc' }));

		state.toggleSort('validated');

		expect(state.params.sortDate).toBeUndefined();
		expect(state.params.sortValidated).toBe('asc');
	});

	it('setPage updates the page and nothing else', () => {
		const state = new TableState(params({ notes: 'rent', sortDate: 'asc' }));

		state.setPage(5);

		expect(state.page).toBe(5);
		expect(state.params.notes).toBe('rent');
		expect(state.params.sortDate).toBe('asc');
	});

	it('setPageSize updates the pageSize and resets the page', () => {
		const state = new TableState(params({ page: '4' }));

		state.setPageSize(50);

		expect(state.pageSize).toBe(50);
		expect(state.page).toBe(1);
	});
});
