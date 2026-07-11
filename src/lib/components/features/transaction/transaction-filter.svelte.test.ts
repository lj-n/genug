import { TransactionsURLParamsSchema } from '$lib/schemas/transaction';
import { parse } from 'valibot';
import { describe, expect, it } from 'vitest';

import { TransactionFilter } from './transaction-filter.svelte';

function params(input: Record<string, unknown> = {}) {
	return parse(TransactionsURLParamsSchema, input);
}

describe('TransactionFilter', () => {
	it('hydrates with all filters inactive when params are empty', () => {
		const filter = new TransactionFilter(params());

		expect(filter.items).toEqual([
			{ active: false, type: 'category', value: [] },
			{ active: false, type: 'notes', value: '' }
		]);
	});

	it('hydrates active filters from params values', () => {
		const filter = new TransactionFilter(params({ categoryId: ['cat-1'], notes: 'rent' }));

		expect(filter.items).toEqual([
			{ active: true, type: 'category', value: ['cat-1'] },
			{ active: true, type: 'notes', value: 'rent' }
		]);
	});

	it('add activates a filter without changing its value', () => {
		const filter = new TransactionFilter(params());

		filter.add('notes');

		expect(filter.items).toContainEqual({ active: true, type: 'notes', value: '' });
	});

	it('updateValue sets the value of a filter', () => {
		const filter = new TransactionFilter(params());

		filter.add('category');
		filter.updateValue('category', ['cat-1', 'cat-2']);

		expect(filter.items).toContainEqual({
			active: true,
			type: 'category',
			value: ['cat-1', 'cat-2']
		});
	});

	it('remove deactivates a filter and resets its value', () => {
		const filter = new TransactionFilter(params({ categoryId: ['cat-1'], notes: 'rent' }));

		filter.remove('category');

		expect(filter.items).toEqual([
			{ active: false, type: 'category', value: [] },
			{ active: true, type: 'notes', value: 'rent' }
		]);
	});

	it('clearAll deactivates every filter and resets all values', () => {
		const filter = new TransactionFilter(params({ categoryId: ['cat-1'], notes: 'rent' }));

		filter.clearAll();

		expect(filter.items).toEqual([
			{ active: false, type: 'category', value: [] },
			{ active: false, type: 'notes', value: '' }
		]);
	});

	it('exposes allActive, anyActive and available accessors', () => {
		const filter = new TransactionFilter(params({ notes: 'rent' }));

		expect(filter.allActive).toBe(false);
		expect(filter.anyActive).toBe(true);
		expect(filter.available.map((f) => f.type)).toEqual(['category']);

		filter.add('category');

		expect(filter.allActive).toBe(true);
		expect(filter.available).toEqual([]);

		filter.clearAll();

		expect(filter.anyActive).toBe(false);
	});
});
