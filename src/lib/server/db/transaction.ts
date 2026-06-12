import { database, type Database, tables } from '$db';
import { and, eq, getColumns, inArray } from 'drizzle-orm';

import { userHasRole } from './budget.utils';
import {
	type TransactionFilterParam,
	type TransactionSortParam,
	withFilter,
	withPagination,
	withSorted
} from './transaction.utils';

export type { TransactionFilterParam, TransactionSortParam };
export type { TransactionPaginationParam } from './transaction.utils';

export type ListTransaction = ReturnType<typeof listTransactions>['transactions'][number];

export function batchDeleteTransactions({
	db = database,
	ids,
	userId
}: {
	db?: Database;
	ids: string[];
	userId: string;
}) {
	return db
		.delete(tables.transactions)
		.where(
			and(
				userHasRole('MEMBER', tables.transactions.budgetId, userId, db),
				inArray(tables.transactions.id, ids)
			)
		)
		.returning()
		.all();
}

export function batchValidateTransactions({
	db = database,
	ids,
	userId,
	validated
}: {
	db?: Database;
	ids: string[];
	userId: string;
	validated: boolean;
}) {
	return db
		.update(tables.transactions)
		.set({ validated })
		.where(
			and(
				inArray(tables.transactions.id, ids),
				userHasRole('MEMBER', tables.transactions.budgetId, userId, db)
			)
		)
		.returning()
		.all();
}

export function createTransaction({
	data,
	db = database,
	userId
}: {
	data: typeof tables.transactions.$inferInsert;
	db?: Database;
	userId: string;
}) {
	return db.transaction((tx) => {
		const budget = tx
			.select({ id: tables.budgets.id })
			.from(tables.budgets)
			.where(
				and(
					eq(tables.budgets.id, data.budgetId),
					userHasRole('MEMBER', tables.budgets.id, userId, db)
				)
			)
			.get();

		if (!budget) throw new Error('Budget not found');

		return tx.insert(tables.transactions).values(data).returning().get();
	});
}

export function getTransactionById({
	db = database,
	id,
	userId
}: {
	db?: Database;
	id: string;
	userId: string;
}) {
	return db
		.select(getColumns(tables.transactions))
		.from(tables.transactions)
		.where(
			and(
				eq(tables.transactions.id, id),
				userHasRole('MEMBER', tables.transactions.budgetId, userId, db)
			)
		)
		.get();
}
export function listTransactions({
	db = database,
	filter = {},
	pagination,
	sort = {},
	userId
}: {
	db?: Database;
	filter?: TransactionFilterParam;
	pagination?: { page: number; pageSize: number };
	sort?: TransactionSortParam;
	userId: string;
}) {
	let dq = db
		.select({
			...getColumns(tables.transactions),
			categoryName: tables.categories.name,
			createdByName: tables.users.username
		})
		.from(tables.transactions)
		.leftJoin(tables.categories, eq(tables.transactions.categoryId, tables.categories.id))
		.leftJoin(tables.users, eq(tables.transactions.createdBy, tables.users.id))
		.where(userHasRole('MEMBER', tables.transactions.budgetId, userId, db))
		.$dynamic();

	dq = withFilter({ dq, filter });
	dq = withSorted({ dq, sort });

	if (pagination) {
		dq = withPagination({ dq, ...pagination });
	}

	return { transactions: dq.all() };
}

export function updateTransaction({
	db = database,
	id,
	update,
	userId
}: {
	db?: Database;
	id: string;
	update: Partial<typeof tables.transactions.$inferInsert>;
	userId: string;
}) {
	return db
		.update(tables.transactions)
		.set(update)
		.where(
			and(
				eq(tables.transactions.id, id),
				userHasRole('MEMBER', tables.transactions.budgetId, userId, db)
			)
		)
		.returning()
		.get();
}
