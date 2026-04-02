import { tables } from '$db';
import { eq, sql } from 'drizzle-orm';

import { userHasPermission } from './permissions';

export function createAccountActions({
	database,
	user
}: {
	database: App.Database;
	user: App.User;
}) {
	return {
		async all() {
			return database
				.select({
					balance: sql<number>`COALESCE(SUM(${tables.transactions.amount}), 0)`,
					budgetId: tables.accounts.budgetId,
					id: tables.accounts.id,
					name: tables.accounts.name
				})
				.from(tables.accounts)
				.leftJoin(tables.transactions, eq(tables.transactions.accountId, tables.accounts.id))
				.where(
					userHasPermission({
						budgetIdCol: tables.accounts.budgetId,
						database,
						userId: user.id
					})
				)
				.groupBy(tables.accounts.id);
		}
	};
}
