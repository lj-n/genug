import { tables } from '$db';
import { and, eq, inArray, isNull, sql } from 'drizzle-orm';

import { userHasPermission } from './permissions';

export function createAccountActions({
	database,
	user
}: {
	database: App.Database;
	user: App.User;
}) {
	return {
		all() {
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
				.groupBy(tables.accounts.id)
				.all();
		},

		reorder({ orderedIds }: { orderedIds: string[] }) {
			const availableAccountIds = database
				.select({ id: tables.accounts.id })
				.from(tables.accounts)
				.where(
					and(
						inArray(tables.accounts.id, orderedIds),
						isNull(tables.accounts.archived_at),
						userHasPermission({
							budgetIdCol: tables.accounts.budgetId,
							database,
							userId: user.id
						})
					)
				)
				.all();

			if (availableAccountIds.length !== orderedIds.length) {
				throw new Error('Invalid account ids');
			}

			database.transaction((tx) => {
				for (const [position, accountId] of orderedIds.entries()) {
					tx.insert(tables.userEntityOrder)
						.values({
							entityId: accountId,
							entityType: 'account',
							position,
							userId: user.id
						})
						.onConflictDoUpdate({
							set: { position },
							target: [
								tables.userEntityOrder.userId,
								tables.userEntityOrder.entityType,
								tables.userEntityOrder.entityId
							]
						})
						.execute();
				}
			});
		}
	};
}
