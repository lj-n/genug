import type { SQLiteColumn, SQLiteSelect } from 'drizzle-orm/sqlite-core';

import { tables } from '$db';
import { UNASSIGNED } from '$lib/constants';
import { and, asc, desc, eq, gte, inArray, isNull, like, lte, or, type SQL } from 'drizzle-orm';

export type TransactionFilterParam = {
	accountId?: string | string[];
	categoryId?: string[];
	fromDate?: string;
	maxAmount?: number;
	minAmount?: number;
	notes?: string;
	toDate?: string;
	validated?: boolean;
};

export type TransactionPaginationParam = {
	page: number;
	pageSize: number;
	totalTransactionCount: number;
};

export type TransactionSortParam = {
	account?: SortParam;
	amount?: SortParam;
	category?: SortParam;
	date?: SortParam;
	validated?: SortParam;
};

type SortParam = 'asc' | 'desc';

export function withFilter<T extends SQLiteSelect>({
	dq,
	filter = {}
}: {
	dq: T;
	filter?: TransactionFilterParam;
}) {
	const conditions: (SQL | undefined)[] = [];

	if (filter.accountId) {
		conditions.push(
			typeof filter.accountId === 'string'
				? eq(tables.transactions.accountId, filter.accountId)
				: inArray(tables.transactions.accountId, filter.accountId)
		);
	}
	if (filter.categoryId) {
		const ids = filter.categoryId;
		const realIds = ids.filter((id: string) => id !== UNASSIGNED);
		const hasNull = ids.includes(UNASSIGNED);

		const categoryConditions: SQL[] = [];
		if (realIds.length > 0)
			categoryConditions.push(inArray(tables.transactions.categoryId, realIds));
		if (hasNull) categoryConditions.push(isNull(tables.transactions.categoryId));

		conditions.push(
			categoryConditions.length === 1 ? categoryConditions[0] : or(...categoryConditions)
		);
	}
	if (filter.notes) {
		conditions.push(like(tables.transactions.notes, `%${escapeLikePattern(filter.notes)}%`));
	}
	if (filter.validated !== undefined) {
		conditions.push(eq(tables.transactions.validated, filter.validated));
	}
	if (filter.minAmount) {
		conditions.push(gte(tables.transactions.amount, filter.minAmount));
	}
	if (filter.maxAmount) {
		conditions.push(lte(tables.transactions.amount, filter.maxAmount));
	}
	if (filter.fromDate) {
		conditions.push(gte(tables.transactions.date, filter.fromDate));
	}
	if (filter.toDate) {
		conditions.push(lte(tables.transactions.date, filter.toDate));
	}

	return dq.where(and(...conditions));
}

export function withPagination<T extends SQLiteSelect>({
	dq,
	page,
	pageSize
}: {
	dq: T;
	page: number;
	pageSize: number;
}) {
	return dq.limit(pageSize).offset(page * pageSize);
}

export function withSorted<T extends SQLiteSelect>({
	dq,
	sort = {}
}: {
	dq: T;
	sort?: TransactionSortParam;
}) {
	const sql: SQL[] = [];
	if (sort?.date) {
		sql.push(sortDirection(sort.date, tables.transactions.date));
	}

	if (sort?.validated) {
		sql.push(sortDirection(sort.validated, tables.transactions.validated));
	}

	if (sort?.account) {
		sql.push(sortDirection(sort.account, tables.transactions.accountId));
	}

	if (sort?.category) {
		sql.push(sortDirection(sort.category, tables.transactions.categoryId));
	}

	if (sort?.amount) {
		sql.push(sortDirection(sort.amount, tables.transactions.amount));
	}

	sql.push(desc(tables.transactions.createdAt));

	return dq.orderBy(...sql);
}

function escapeLikePattern(term: string) {
	return term.replace(/[\\%_]/g, '\\$&');
}

function sortDirection(direction: SortParam, column: SQLiteColumn) {
	return direction === 'asc' ? asc(column) : desc(column);
}
