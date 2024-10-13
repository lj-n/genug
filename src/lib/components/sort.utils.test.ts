import { describe, expect, test } from 'vitest';
import { removeThenAppendNewSortedIdsToArray } from './sort.utils';

describe('sort utils', () => {
	test('removeThenAppendNewSortedIdsToArray', () => {
		const oldIds = [1, 2, 3, 4, 5];
		const newSortedIds = [99, 5, 3, 1];
		const result = removeThenAppendNewSortedIdsToArray(oldIds, newSortedIds);
		expect(result).toEqual([2, 4, 99, 5, 3, 1]);
	});
});
