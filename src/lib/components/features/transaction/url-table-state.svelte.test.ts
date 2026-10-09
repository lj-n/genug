import { TransactionsURLParamsSchema } from '$lib/schemas/transaction';
import { parse } from 'valibot';
import { describe, expect, it } from 'vitest';

import { UrlTableState } from './url-table-state.svelte';

const ORIGIN = 'http://localhost';

function follow(table: UrlTableState, path: string) {
	const target = url(path);
	table.follow(target, urlParams(target));
}

function url(path: string) {
	return new URL(path, ORIGIN);
}

/** Parses a URL's table params the way the register does. */
function urlParams(target: URL) {
	return () =>
		parse(TransactionsURLParamsSchema, {
			categoryId: target.searchParams.getAll('categoryId'),
			notes: target.searchParams.get('notes'),
			page: target.searchParams.get('page'),
			sortDate: target.searchParams.get('sortDate')
		});
}

function visit(path: string) {
	const start = url(path);
	return new UrlTableState(start, urlParams(start)());
}

describe('UrlTableState', () => {
	it('starts from the URL it was built from', () => {
		const table = visit('/b/accounts/a?categoryId=cat-1&page=2');

		expect(
			table.paramsAt(url('/b/accounts/a?categoryId=cat-1&page=2'), () => {
				throw new Error('the state owns this URL');
			})
		).toMatchObject({ categoryId: ['cat-1'], page: 2 });
	});

	it('queries with the state while its own edits are on their way to the URL', () => {
		const table = visit('/b/accounts/a');

		table.state.setFilter('notes', 'rent');

		expect(table.paramsAt(url('/b/accounts/a'), urlParams(url('/b/accounts/a')))).toMatchObject({
			notes: 'rent'
		});
	});

	it('queries with the target URL while a navigation has not been followed yet', () => {
		const table = visit('/b/accounts/a?categoryId=cat-1');

		const target = url('/b/accounts/other');
		expect(table.paramsAt(target, urlParams(target))).toMatchObject({ categoryId: [] });
		expect(table.state.params.categoryId).toEqual(['cat-1']);
	});

	it('keeps the state when one of its own URL writes lands', () => {
		const table = visit('/b/accounts/a');
		const { filter } = table.state;

		table.state.setFilter('notes', 'rent');
		table.navigatingTo(url('/b/accounts/a?notes=rent'));
		table.state.setPage(3);
		follow(table, '/b/accounts/a?notes=rent');

		expect(table.state.filter).toBe(filter);
		expect(table.state.params).toMatchObject({ notes: 'rent', page: 3 });
		const landed = url('/b/accounts/a?notes=rent');
		expect(table.paramsAt(landed, urlParams(landed))).toMatchObject({ page: 3 });
	});

	it('resets from the URL on a switch to another account', () => {
		const table = visit('/b/accounts/a?categoryId=cat-1');

		follow(table, '/b/accounts/other');

		expect(table.state.params).toMatchObject({ categoryId: [], page: 1 });
	});

	it('resets when the switch back lands before the other account ever did', () => {
		const table = visit('/b/accounts/a');
		table.state.setFilter('category', ['cat-1']);
		table.navigatingTo(url('/b/accounts/a?categoryId=cat-1'));
		follow(table, '/b/accounts/a?categoryId=cat-1');

		// A -> B -> A: B never settles, so the next URL this state sees is A's clean link.
		follow(table, '/b/accounts/a');

		expect(table.state.params.categoryId).toEqual([]);
		expect(table.state.filter.anyActive).toBe(false);
	});

	it('does not mistake an earlier own write for the current one', () => {
		const table = visit('/b/accounts/a');
		table.state.setFilter('category', ['cat-1']);
		table.navigatingTo(url('/b/accounts/a?categoryId=cat-1'));
		follow(table, '/b/accounts/a?categoryId=cat-1');
		table.state.clearAllFilters();
		table.navigatingTo(url('/b/accounts/a'));
		follow(table, '/b/accounts/a');
		table.state.setFilter('category', ['cat-1']);
		table.navigatingTo(url('/b/accounts/a?categoryId=cat-1'));
		follow(table, '/b/accounts/a?categoryId=cat-1');

		follow(table, '/b/accounts/a');

		expect(table.state.params.categoryId).toEqual([]);
	});

	it('treats an empty query the same as no query', () => {
		const table = visit('/b/accounts/a?notes=rent');
		table.state.clearAllFilters();
		table.navigatingTo(url('/b/accounts/a?'));

		follow(table, '/b/accounts/a');

		expect(table.state.filter.anyActive).toBe(false);
		table.state.setPage(2);
		follow(table, '/b/accounts/a');
		expect(table.state.page).toBe(2);
	});
});
