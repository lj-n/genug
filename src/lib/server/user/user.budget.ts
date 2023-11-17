import { and, eq, gt, sql } from 'drizzle-orm';
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

	function getAssignableBalance() {
		const transactionSum = transactionSumQuery.get({ userId });
		console.log("🛸 < file: user.budget.ts:57 < transactionSum =", transactionSum);
		const budgetSum = budgetSumQuery.get({ userId });
		console.log("🛸 < file: user.budget.ts:59 < budgetSum =", budgetSum);
		return (transactionSum?.value || 0) - (budgetSum?.value || 0);
	}

	return { set, get, getAssignableBalance };
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

const transactionSumQuery = db
	.select({
		value: sql<number>`coalesce(sum(${schema.userTransaction.flow}), 0)`
	})
	.from(schema.userTransaction)
	.where(and(
    eq(schema.userTransaction.userId, sql.placeholder('userId')),
    gt(schema.userTransaction.flow, 0)
  ))
	.prepare();

const budgetSumQuery = db
	.select({
		value: sql<number>`coalesce(sum(${schema.userBudget.amount}), 0)`
	})
	.from(schema.userBudget)
	.where(eq(schema.userBudget.userId, sql.placeholder('userId')))
	.prepare();
