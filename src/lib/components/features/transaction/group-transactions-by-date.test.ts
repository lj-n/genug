import { describe, expect, it } from 'vitest';

import { groupTransactionsByDate } from './group-transactions-by-date';

const tx = (id: string, date: string) => ({ date, id });

describe('groupTransactionsByDate', () => {
	it('returns no groups for an empty list', () => {
		expect(groupTransactionsByDate([])).toEqual([]);
	});

	it('groups transactions sharing a date into one group', () => {
		const groups = groupTransactionsByDate([
			tx('a', '2026-07-14'),
			tx('b', '2026-07-14'),
			tx('c', '2026-07-13')
		]);

		expect(groups).toHaveLength(2);
		expect(groups[0].date).toBe('2026-07-14');
		expect(groups[0].transactions.map((t) => t.id)).toEqual(['a', 'b']);
		expect(groups[1].date).toBe('2026-07-13');
		expect(groups[1].transactions.map((t) => t.id)).toEqual(['c']);
	});

	it('orders groups newest-first regardless of input order', () => {
		const groups = groupTransactionsByDate([
			tx('a', '2026-01-05'),
			tx('b', '2026-07-14'),
			tx('c', '2025-12-31')
		]);

		expect(groups.map((g) => g.date)).toEqual(['2026-07-14', '2026-01-05', '2025-12-31']);
	});

	it('preserves the input order within a group', () => {
		const groups = groupTransactionsByDate([
			tx('first', '2026-07-14'),
			tx('other', '2026-07-13'),
			tx('second', '2026-07-14'),
			tx('third', '2026-07-14')
		]);

		expect(groups[0].transactions.map((t) => t.id)).toEqual(['first', 'second', 'third']);
	});
});
