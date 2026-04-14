import { tables } from '$db';
import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm';

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
				.leftJoin(
					tables.userEntityOrder,
					and(
						eq(tables.userEntityOrder.entityType, 'account'),
						eq(tables.userEntityOrder.userId, user.id),
						eq(tables.userEntityOrder.entityId, tables.accounts.id)
					)
				)
				.orderBy(
					sql`CASE WHEN ${tables.userEntityOrder.position} IS NULL THEN 1 ELSE 0 END`,
					asc(tables.userEntityOrder.position),
					asc(tables.accounts.createdAt),
					asc(tables.accounts.id)
				)
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

		create({ budgetId, name }: { budgetId: string; name: string }) {
			return database.transaction((tx) => {
				const budget = tx
					.select({ id: tables.budgets.id })
					.from(tables.budgets)
					.where(
						and(
							eq(tables.budgets.id, budgetId),
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

				const account = tx.insert(tables.accounts).values({ budgetId, name }).returning().get();

				tx.insert(tables.userEntityOrder)
					.values({
						entityId: account.id,
						entityType: 'account',
						position: 0,
						userId: user.id
					})
					.execute();

				return account;
			});
		},

		reorder({ orderedIds }: { orderedIds: string[] }) {
			const availableAccountIds = database
				.select({ id: tables.accounts.id })
				.from(tables.accounts)
				.where(
					and(
						inArray(tables.accounts.id, orderedIds),
						isNull(tables.accounts.archivedAt),
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
