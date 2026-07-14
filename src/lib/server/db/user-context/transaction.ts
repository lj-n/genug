import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';

import { database, type Database, tables } from '$db';
import { UNASSIGNED } from '$lib/constants';
import { m } from '$lib/paraglide/messages';
import { getLocalTimeZone, today } from '@internationalized/date';
import { error } from '@sveltejs/kit';
import {
	and,
	asc,
	count,
	desc,
	eq,
	getColumns,
	inArray,
	isNull,
	or,
	type SQL,
	sql
} from 'drizzle-orm';

import { accessGuard, hasAccess } from './access';

export type TransactionFilterParam = {
	accountId?: string;
	categoryId?: string[];
	notes?: string;
};

export type TransactionSortParam = {
	account?: SortParam;
	amount?: SortParam;
	category?: SortParam;
	date?: SortParam;
	validated?: SortParam;
};

type SortParam = 'asc' | 'desc';

export const queries = (userId: string, db: Database = database) => ({
	byId: (id: string) => {
		const found = db
			.select(getColumns(tables.transactions))
			.from(tables.transactions)
			.where(and(hasAccess(tables.transactions, userId, db), eq(tables.transactions.id, id)))
			.get();

		if (!found) error(404);
		return found;
	},

	page: (
		filter: TransactionFilterParam,
		sort: TransactionSortParam,
		pagination: { page: number; pageSize: number }
	) => {
		const where = and(hasAccess(tables.transactions, userId, db), ...filterConditions(filter));

		const rows = db
			.select({
				...getColumns(tables.transactions),
				categoryName: tables.categories.name,
				createdByName: tables.users.username
			})
			.from(tables.transactions)
			.leftJoin(tables.categories, eq(tables.transactions.categoryId, tables.categories.id))
			.leftJoin(tables.users, eq(tables.transactions.createdBy, tables.users.id))
			.where(where)
			.orderBy(...sortOrder(sort))
			.limit(pagination.pageSize)
			.offset(pagination.page * pagination.pageSize)
			.all();

		const total =
			db.select({ total: count() }).from(tables.transactions).where(where).get()?.total ?? 0;

		return { rows, total };
	}
});

export type ListTransaction = ReturnType<ReturnType<typeof queries>['page']>['rows'][number];

export const commands = (userId: string, db: Database = database) => ({
	create: (data: Omit<typeof tables.transactions.$inferInsert, 'date'> & { date?: string }) => {
		accessGuard(data.budgetId, userId, db);

		// An archived account is inert: reject new transactions server-side so a
		// stale tab or back-navigation can never write to it (see ADR-0011).
		const account = db
			.select({ archivedAt: tables.accounts.archivedAt })
			.from(tables.accounts)
			.where(
				and(eq(tables.accounts.id, data.accountId), eq(tables.accounts.budgetId, data.budgetId))
			)
			.get();
		if (!account) error(404, m.error_account_not_found());
		if (account.archivedAt) error(400, m.error_account_archived());

		return db.transaction((tx) => {
			return tx
				.insert(tables.transactions)
				.values({ ...data, date: data.date ?? today(getLocalTimeZone()).toString() })
				.returning()
				.get();
		});
	},

	delete: (ids: string[]) => {
		return db
			.delete(tables.transactions)
			.where(and(hasAccess(tables.transactions, userId, db), inArray(tables.transactions.id, ids)))
			.returning()
			.all();
	},

	edit: (id: string, update: Partial<typeof tables.transactions.$inferInsert>) => {
		const data = { ...update, validated: update.validated ?? false };
		const updated = db
			.update(tables.transactions)
			.set(data)
			.where(and(hasAccess(tables.transactions, userId, db), eq(tables.transactions.id, id)))
			.returning()
			.get();

		if (!updated) error(404);
		return updated;
	},

	validate: (ids: string[], validated: boolean) => {
		return db
			.update(tables.transactions)
			.set({ validated })
			.where(and(inArray(tables.transactions.id, ids), hasAccess(tables.transactions, userId, db)))
			.returning()
			.all();
	}
});

function escapeLikePattern(term: string) {
	return term.replace(/[\\%_]/g, '\\$&');
}

function filterConditions(filter: TransactionFilterParam) {
	const conditions: (SQL | undefined)[] = [];

	if (filter.accountId) {
		conditions.push(eq(tables.transactions.accountId, filter.accountId));
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
		// SQLite's LIKE has no default escape character; ESCAPE makes \-escaped % and _ literal.
		const pattern = `%${escapeLikePattern(filter.notes)}%`;
		conditions.push(sql`${tables.transactions.notes} LIKE ${pattern} ESCAPE '\\'`);
	}

	return conditions;
}

function sortDirection(direction: SortParam, column: SQLiteColumn) {
	return direction === 'asc' ? asc(column) : desc(column);
}

function sortOrder(sort: TransactionSortParam) {
	const order: SQL[] = [];

	if (sort.date) {
		order.push(sortDirection(sort.date, tables.transactions.date));
	}
	if (sort.validated) {
		order.push(sortDirection(sort.validated, tables.transactions.validated));
	}
	if (sort.account) {
		order.push(sortDirection(sort.account, tables.transactions.accountId));
	}
	if (sort.category) {
		order.push(sortDirection(sort.category, tables.transactions.categoryId));
	}
	if (sort.amount) {
		order.push(sortDirection(sort.amount, tables.transactions.amount));
	}

	order.push(desc(tables.transactions.createdAt));

	return order;
}
