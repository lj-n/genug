import { TransactionsURLParamsSchema } from '$lib/schemas/transaction';
import { parse } from 'valibot';
import { describe, expect, it } from 'vitest';

import { TransactionSort } from './transaction-sort.svelte';

function params(input: Record<string, unknown> = {}) {
	return parse(TransactionsURLParamsSchema, input);
}

describe('TransactionSort', () => {
	it('hydrates with no active column when params are empty', () => {
		const sort = new TransactionSort(params());

		expect(sort.column).toBeNull();
		expect(sort.direction).toBeNull();
	});

	it.each([
		['sortDate', 'date'],
		['sortCategory', 'category'],
		['sortAmount', 'amount'],
		['sortValidated', 'validated']
	] as const)('hydrates %s into the %s column', (param, column) => {
		const sort = new TransactionSort(params({ [param]: 'desc' }));

		expect(sort.column).toBe(column);
		expect(sort.direction).toBe('desc');
	});

	it('resolves date first when multiple sort params are set', () => {
		const sort = new TransactionSort(params({ sortAmount: 'asc', sortDate: 'desc' }));

		expect(sort.column).toBe('date');
		expect(sort.direction).toBe('desc');
	});

	it('toggle cycles a column null → asc → desc → null', () => {
		const sort = new TransactionSort(params());

		sort.toggle('amount');
		expect(sort.column).toBe('amount');
		expect(sort.direction).toBe('asc');

		sort.toggle('amount');
		expect(sort.column).toBe('amount');
		expect(sort.direction).toBe('desc');

		sort.toggle('amount');
		expect(sort.column).toBeNull();
		expect(sort.direction).toBeNull();
	});

	it('toggle on a different column switches to it with direction asc', () => {
		const sort = new TransactionSort(params({ sortDate: 'desc' }));

		sort.toggle('category');

		expect(sort.column).toBe('category');
		expect(sort.direction).toBe('asc');
	});
});
