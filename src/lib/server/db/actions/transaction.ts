import { tables } from '$db';
import { eq, getColumns } from 'drizzle-orm';

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
			const dynamicQuery = database
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

			withFilter({ dq: dynamicQuery, filter });
			withSorted({ dq: dynamicQuery, sort });

			if (pagination) {
				withPagination({ dq: dynamicQuery, ...pagination });
			}

			return {
				transactions: dynamicQuery.all()
			};
		}
	};
}
