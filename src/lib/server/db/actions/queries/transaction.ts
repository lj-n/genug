import type { SQLiteColumn, SQLiteSelect } from 'drizzle-orm/sqlite-core';

import { tables } from '$db';
import { asc, desc, eq, gte, inArray, like, lte, SQL } from 'drizzle-orm';

export type TransactionFilterParam = {
	accountId?: string | string[];
	categoryId?: string | string[];
	fromDate?: string; // YYYY-MM-DD
	maxAmount?: number;
	minAmount?: number;
	notes?: string;
	toDate?: string; // YYYY-MM-DD
	validated?: boolean;
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
	if (filter?.accountId) {
		if (typeof filter.accountId === 'string') {
			dq = dq.where(eq(tables.transactions.accountId, filter.accountId));
		} else {
			dq = dq.where(inArray(tables.transactions.accountId, filter.accountId));
		}
	}

	if (filter?.categoryId) {
		if (typeof filter.categoryId === 'string') {
			dq = dq.where(eq(tables.transactions.categoryId, filter.categoryId));
		} else {
			dq = dq.where(inArray(tables.transactions.categoryId, filter.categoryId));
		}
	}

	if (filter?.notes) {
		dq = dq.where(like(tables.transactions.notes, `%${escapeLikePattern(filter.notes)}%`));
	}

	if (filter?.validated !== undefined) {
		dq = dq.where(eq(tables.transactions.validated, filter.validated));
	}

	if (filter?.maxAmount) {
		dq = dq.where(gte(tables.transactions.amount, filter.maxAmount));
	}

	if (filter?.minAmount) {
		dq = dq.where(lte(tables.transactions.amount, filter.minAmount));
	}

	if (filter?.fromDate) {
		dq = dq.where(gte(tables.transactions.date, filter.fromDate));
	}

	if (filter?.toDate) {
		dq = dq.where(lte(tables.transactions.date, filter.toDate));
	}

	return dq;
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

	sql.push(desc(tables.transactions.createdAt));

	return dq.orderBy(...sql);
}

function escapeLikePattern(term: string) {
	return term.replace(/[\\%_]/g, '\\$&');
}

function sortDirection(direction: SortParam, column: SQLiteColumn) {
	return direction === 'asc' ? asc(column) : desc(column);
}
