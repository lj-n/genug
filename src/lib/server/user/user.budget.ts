import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { schema } from '../schema';
import type { SelectUserBudget } from '../schema/tables';

export function useUserBudget(userId: string) {
	/**
	 * Upserts a budget for a category and month.
	 * If the amount is 0 the budget gets deleted if it exists.
	 */
	function set({ amount, date, categoryId }: Omit<SelectUserBudget, 'userId'>) {
		db.transaction(() => {
			if (amount === 0) {
				db.delete(schema.userBudget)
					.where(
						and(
							eq(schema.userBudget.date, date),
							eq(schema.userBudget.userId, userId),
							eq(schema.userBudget.categoryId, categoryId)
						)
					)
					.returning()
					.get();

				return;
			}

			db.insert(schema.userBudget)
				.values({
					userId,
					amount,
					categoryId,
					date
				})
				.onConflictDoUpdate({
					target: [
						schema.userBudget.date,
						schema.userBudget.categoryId,
						schema.userBudget.userId
					],
					set: { amount, categoryId }
				})
				.returning()
				.get();
		});
	}

	/**
	 * Get all categories with their monthly budget data.
	 */
	function get(month: string) {
		return categoriesWithBudget.all({ userId, month });
	}

	return { set, get };
}

/**
 * Get each category for a user with the budget, activity and rest sum for a month.
 * @param {string} userId
 * @param {string} month
 */
const categoriesWithBudget = db
	.select({
		category: schema.userCategory,
		budget: sql<number>`coalesce(${schema.userBudget.amount}, 0)`,
		activity: sql<number>`coalesce(sum(${schema.userTransaction.flow}), 0)`,
		rest: sql<number>`
      coalesce((
        select sum(${schema.userBudget.amount})
        from ${schema.userBudget}
        where ${schema.userBudget.userId} = ${schema.userCategory.userId}
        and ${schema.userBudget.categoryId} = ${schema.userCategory.id}
        and ${schema.userBudget.date} <= ${sql.placeholder('month')}
      ), 0)
      +
      coalesce((
        select sum(${schema.userTransaction.flow})
        from ${schema.userTransaction}
        where ${schema.userTransaction.userId} = ${schema.userCategory.userId}
        and ${schema.userTransaction.categoryId} = ${schema.userCategory.id}
        and strftime('%Y-%m', ${
					schema.userTransaction.date
				}) <= ${sql.placeholder('month')}
      ), 0)
    `
	})
	.from(schema.userCategory)
	.leftJoin(
		schema.userBudget,
		and(
			eq(schema.userBudget.date, sql.placeholder('month')),
			eq(schema.userBudget.categoryId, schema.userCategory.id)
		)
	)
	.leftJoin(
		schema.userTransaction,
		and(
			eq(
				sql`strftime('%Y-%m', ${schema.userTransaction.date})`,
				sql.placeholder('month')
			),
			eq(schema.userTransaction.categoryId, schema.userCategory.id)
		)
	)
	.where(
		and(
			eq(schema.userCategory.userId, sql.placeholder('userId')),
			eq(schema.userCategory.retired, false)
		)
	)
	.groupBy(({ category }) => category.id)
	.prepare();
