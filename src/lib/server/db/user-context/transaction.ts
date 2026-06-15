import { database, type Database, tables } from '$db';
import { error } from '@sveltejs/kit';
import { and, eq, getColumns, inArray } from 'drizzle-orm';

import { accessGuard, hasAccess } from './access';
import {
	type TransactionFilterParam,
	type TransactionSortParam,
	withFilter,
	withPagination,
	withSorted
} from './transaction.utils';

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

	list: (
		filter: TransactionFilterParam = {},
		sort: TransactionSortParam = {},
		pagination?: { page: number; pageSize: number }
	) => {
		let dq = db
			.select({
				...getColumns(tables.transactions),
				categoryName: tables.categories.name,
				createdByName: tables.users.username
			})
			.from(tables.transactions)
			.leftJoin(tables.categories, eq(tables.transactions.categoryId, tables.categories.id))
			.leftJoin(tables.users, eq(tables.transactions.createdBy, tables.users.id))
			.where(hasAccess(tables.transactions, userId, db))
			.$dynamic();

		dq = withFilter({ dq, filter });
		dq = withSorted({ dq, sort });

		if (pagination) {
			dq = withPagination({ dq, ...pagination });
		}

		return dq.all();
	}
});

export type ListTransaction = Awaited<ReturnType<ReturnType<typeof queries>['list']>>[number];

export const commands = (userId: string, db: Database = database) => ({
	create: (data: typeof tables.transactions.$inferInsert) => {
		accessGuard(data.budgetId, userId, db);

		return db.transaction((tx) => {
			return tx.insert(tables.transactions).values(data).returning().get();
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
		const updated = db
			.update(tables.transactions)
			.set(update)
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
