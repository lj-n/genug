import { tables } from '$db';
import { and, eq, getColumns, inArray } from 'drizzle-orm';

import { userHasPermission } from './permissions';
import {
	type TransactionFilterParam,
	type TransactionSortParam,
	withFilter,
	withPagination,
	withSorted
} from './queries/transaction';

export function createTransactionActions({
	database,
	user
}: {
	database: App.Database;
	user: App.User;
}) {
	return {
		batchValidate({ ids, validated }: { ids: string[]; validated: boolean }) {
			return database
				.update(tables.transactions)
				.set({ validated })
				.where(
					and(
						inArray(tables.transactions.id, ids),
						userHasPermission({
							budgetIdCol: tables.transactions.budgetId,
							database,
							userId: user.id
						})
					)
				)
				.returning()
				.all();
		},

		create(data: typeof tables.transactions.$inferInsert) {
			return database.transaction((tx) => {
				const budget = tx
					.select({ id: tables.budgets.id })
					.from(tables.budgets)
					.where(
						and(
							eq(tables.budgets.id, data.budgetId),
							userHasPermission({
								budgetIdCol: tables.budgets.id,
								database,
								userId: user.id
							})
						)
					)
					.get();

				if (!budget) {
					throw new Error('Budget not found');
				}

				return tx.insert(tables.transactions).values(data).returning().get();
			});
		},

		getById({ id }: { id: string }) {
			return database
				.select(getColumns(tables.transactions))
				.from(tables.transactions)
				.where(
					and(
						eq(tables.transactions.id, id),
						userHasPermission({
							budgetIdCol: tables.transactions.budgetId,
							database,
							userId: user.id
						})
					)
				)
				.get();
		},

		list({
			filter = {},
			pagination,
			sort = {}
		}: {
			filter?: TransactionFilterParam;
			pagination?: {
				page: number;
				pageSize: number;
			};
			sort?: TransactionSortParam;
		}) {
			let dynamicQuery = database
				.select({
					...getColumns(tables.transactions),
					categoryName: tables.categories.name,
					createdByName: tables.users.username
				})
				.from(tables.transactions)
				.leftJoin(tables.categories, eq(tables.transactions.categoryId, tables.categories.id))
				.leftJoin(tables.users, eq(tables.transactions.createdBy, tables.users.id))
				.where(
					userHasPermission({
						budgetIdCol: tables.transactions.budgetId,
						database,
						userId: user.id
					})
				)
				.$dynamic();

			dynamicQuery = withFilter({ dq: dynamicQuery, filter });
			dynamicQuery = withSorted({ dq: dynamicQuery, sort });

			if (pagination) {
				dynamicQuery = withPagination({ dq: dynamicQuery, ...pagination });
			}

			return {
				transactions: dynamicQuery.all()
			};
		},

		updateById({
			id,
			update
		}: {
			id: string;
			update: Partial<typeof tables.transactions.$inferInsert>;
		}) {
			return database
				.update(tables.transactions)
				.set(update)
				.where(
					and(
						eq(tables.transactions.id, id),
						userHasPermission({
							budgetIdCol: tables.transactions.budgetId,
							database,
							userId: user.id
						})
					)
				)
				.returning()
				.get();
		}
	};
}
