import { and, eq, sql } from 'drizzle-orm';
import { schema } from '../schema';
import type { Database } from '../db';

/**
 * Creates a budget for a month and category in the database.
 * If the budget amount is 0, the existing budget entry will be deleted.
 * If the budget amount is not 0, a new budget entry will be inserted or updated in the database.
 * @param database The database instance.
 * @param userId The ID of the user.
 * @param budget The budget object containing the amount, date, and category ID.
 */
export function setUserBudget(
	database: Database,
	userId: string,
	budget: {
		amount: number;
		date: string;
		categoryId: number;
	}
): void {
	if (budget.amount === 0) {
		database
			.delete(schema.userBudget)
			.where(
				and(
					eq(schema.userBudget.userId, userId),
					eq(schema.userBudget.categoryId, budget.categoryId),
					eq(schema.userBudget.date, budget.date)
				)
			)
			.returning()
			.get();

		return;
	}

	database
		.insert(schema.userBudget)
		.values({
			userId,
			...budget
		})
		.onConflictDoUpdate({
			target: [
				schema.userBudget.date,
				schema.userBudget.categoryId,
				schema.userBudget.userId
			],
			set: { amount: budget.amount, categoryId: budget.categoryId }
		})
		.returning()
		.get();
}

/**
 * Retrieves the budgets for a specific user and month from the database.
 * @param database The database instance.
 * @param userId The ID of the user.
 * @param month The month in YYYY-MM format.
 * @returns An array of objects containing the category, budget amount, activity amount, and remaining amount.
 */
export function getUserBudgets(
	database: Database,
	userId: string,
	month: string
): Array<{
	category: typeof schema.userCategory.$inferSelect;
	budget: number;
	activity: number;
	rest: number;
}> {
	return database
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
        and ${schema.userBudget.date} <= ${month}
      ), 0)
      +
      coalesce((
        select sum(${schema.userTransaction.flow})
        from ${schema.userTransaction}
        where ${schema.userTransaction.userId} = ${schema.userCategory.userId}
        and ${schema.userTransaction.categoryId} = ${schema.userCategory.id}
        and strftime('%Y-%m', ${schema.userTransaction.date}) <= ${month}
      ), 0)
      `
		})
		.from(schema.userCategory)
		.leftJoin(
			schema.userBudget,
			and(
				eq(schema.userBudget.date, month),
				eq(schema.userBudget.categoryId, schema.userCategory.id)
			)
		)
		.leftJoin(
			schema.userTransaction,
			and(
				eq(sql`strftime('%Y-%m', ${schema.userTransaction.date})`, month),
				eq(schema.userTransaction.categoryId, schema.userCategory.id)
			)
		)
		.where(
			and(
				eq(schema.userCategory.userId, userId),
				eq(schema.userCategory.retired, false)
			)
		)
		.groupBy(({ category }) => category.id)
		.all();
}

/**
 * Retrieves the unassigned budget amount for a specific user from the database.
 * The unassigned budget amount is calculated by subtracting the sum of positive transaction flows from the sum of user budget amounts.
 * @param database The database instance.
 * @param userId The ID of the user.
 * @returns The unassigned budget amount.
 */
export function getUnassignedBudget(
	database: Database,
	userId: string
): number {
	return database.get(sql<number>`
    coalesce(
      (
        select sum(${schema.userTransaction.flow})
        from ${schema.userTransaction}
        where ${schema.userTransaction.userId} = ${userId}
        and ${schema.userTransaction.flow} > 0
      ),
      0
    )
    -
    coalesce(
      (
        select sum(${schema.userBudget.amount})
        from ${schema.userBudget}
        where ${schema.userBudget.userId} = ${userId}
      ),
      0
    )
  `);
}
