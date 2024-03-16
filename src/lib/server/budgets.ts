import { and, eq, gt, isNull, lte, ne, or, sql } from 'drizzle-orm';
import type { Database } from './db';
import { schema } from './schema';
import { getCategory } from './categories';

/**
 * Retrieves the budget for every category for a specific user and month.
 *
 * @param database The database instance.
 * @param userId The ID of the user.
 * @param date The date in the format 'YYYY-MM'.
 * @returns An array of budgets for every unretired category.
 */
export function getBudget(database: Database, userId: string, date: string) {
	/** Sums the budget amounts up to and in the provided month */
	const budgetSumSQ = database
		.select({
			categoryId: schema.budget.categoryId,
			sum: sql<number>`coalesce(sum(${schema.budget.amount}), 0)`.as(
				'budgetSum'
			)
		})
		.from(schema.budget)
		.where(lte(schema.budget.date, date))
		.groupBy(schema.budget.categoryId)
		.as('budgetSumSQ');

	/** Sums the transaction flows up to and in the provided month */
	const transactionSumSQ = database
		.select({
			categoryId: schema.transaction.categoryId,
			sum: sql<number>`coalesce(sum(${schema.transaction.flow}), 0)`.as(
				'transactionSum'
			)
		})
		.from(schema.transaction)
		.where(lte(sql`strftime('%Y-%m', ${schema.transaction.date})`, date))
		.groupBy(schema.transaction.categoryId)
		.as('transactionSumSQ');

	const result = database
		.select({
			category: schema.category,
			budget: sql<number>`coalesce(${schema.budget.amount}, 0)`,
			activity: sql<number>`coalesce(sum(${schema.transaction.flow}), 0)`,
			rest: sql<number>`coalesce(${budgetSumSQ.sum}, 0) + coalesce(${transactionSumSQ.sum}, 0)`
		})
		.from(schema.category)
		.leftJoin(budgetSumSQ, eq(schema.category.id, budgetSumSQ.categoryId))
		.leftJoin(
			transactionSumSQ,
			eq(schema.category.id, transactionSumSQ.categoryId)
		)
		.leftJoin(
			schema.teamMember,
			eq(schema.teamMember.teamId, schema.category.teamId)
		)
		.leftJoin(
			schema.transaction,
			and(
				eq(schema.transaction.categoryId, schema.category.id),
				eq(sql`strftime('%Y-%m', ${schema.transaction.date})`, date)
			)
		)
		.leftJoin(
			schema.budget,
			and(
				eq(schema.budget.categoryId, schema.category.id),
				eq(schema.budget.date, date)
			)
		)
		.where(
			and(
				eq(schema.category.retired, false),
				or(
					eq(schema.category.userId, userId),
					and(
						eq(schema.teamMember.userId, userId),
						ne(schema.teamMember.role, 'INVITED')
					)
				)
			)
		)
		.groupBy(schema.category.id)
		.all();

	return result;
}

/** Sets the budget amount for a specific category and month. */
export function setBudget(
	database: Database,
	userId: string,
	budget: Omit<typeof schema.budget.$inferInsert, 'userId'>
) {
	return database.transaction(() => {
		const userOwnsCategory = getCategory(database, userId, budget.categoryId);
		if (!userOwnsCategory) {
			throw new Error('Category not found.');
		}

		if (budget.amount === 0) {
			database
				.delete(schema.budget)
				.where(
					and(
						eq(schema.budget.categoryId, budget.categoryId),
						eq(schema.budget.date, budget.date)
					)
				)
				.returning()
				.get();

			return;
		}

		return database
			.insert(schema.budget)
			.values({
				userId,
				...budget
			})
			.onConflictDoUpdate({
				target: [schema.budget.date, schema.budget.categoryId],
				set: { amount: budget.amount, categoryId: budget.categoryId }
			})
			.returning()
			.get();
	});
}

/** Calculates the amount of money that is yet to be budgeted for the teams. */
function aggregateTeamSleepingMoney(
	database: Database,
	userId: string
): { id: number; name: string; sum: number }[] {
	/** Sum all transaction that belong to a team account and have not category and group by team. */
	const transactionSum = database
		.select({
			teamId: schema.teamMember.teamId,
			sum: sql<number>`coalesce(sum(${schema.transaction.flow}), 0)`.as(
				'transactionSum,'
			)
		})
		.from(schema.transaction)
		.leftJoin(
			schema.account,
			eq(schema.account.id, schema.transaction.accountId)
		)
		.leftJoin(
			schema.teamMember,
			and(
				eq(schema.teamMember.userId, userId),
				eq(schema.teamMember.teamId, schema.account.teamId)
			)
		)
		.where(
			and(
				eq(schema.teamMember.userId, userId),
				ne(schema.teamMember.role, 'INVITED'),
				isNull(schema.transaction.categoryId)
			)
		)
		.groupBy(schema.teamMember.teamId)
		.as('transactionSum');

	/** Sum all assigned budgets that belong to a team category and group by team. */
	const budgetSum = database
		.select({
			teamId: schema.teamMember.teamId,
			sum: sql<number>`coalesce(sum(${schema.budget.amount}), 0)`.as(
				'budgetSum'
			)
		})
		.from(schema.budget)
		.leftJoin(schema.category, eq(schema.category.id, schema.budget.categoryId))
		.leftJoin(
			schema.teamMember,
			eq(schema.teamMember.teamId, schema.category.teamId)
		)
		.where(
			and(
				eq(schema.teamMember.userId, userId),
				ne(schema.teamMember.role, 'INVITED')
			)
		)
		.groupBy(schema.teamMember.teamId)
		.as('budgetSum');

	/** Calculates the amount of money the teams have not yet assigned to a budget. */
	const unAssigned = database
		.select({
			id: schema.team.id,
			name: schema.team.name,
			sum: sql<number>`coalesce(${transactionSum.sum}, 0) - coalesce(${budgetSum.sum}, 0)`.as(
				'unAssigned'
			)
		})
		.from(schema.team)
		.leftJoin(schema.teamMember, eq(schema.teamMember.teamId, schema.team.id))
		.leftJoin(budgetSum, eq(budgetSum.teamId, schema.team.id))
		.leftJoin(transactionSum, eq(transactionSum.teamId, schema.team.id))
		.where(
			and(
				eq(schema.teamMember.userId, userId),
				ne(schema.teamMember.role, 'INVITED')
			)
		)
		.groupBy(schema.team.id)
		.all();

	return unAssigned;
}

/** Calculates the amount of money that is yet to be budgeted for a user. */
function aggregateUserSleepingMoney(
	database: Database,
	userId: string
): number {
	/** Sum all transaction that belong to a user account and have not category. */
	const transactionSum = database
		.select({
			userId: schema.transaction.userId,
			sum: sql<number>`coalesce(sum(${schema.transaction.flow}), 0)`.as(
				'transactionSum'
			)
		})
		.from(schema.transaction)
		.leftJoin(
			schema.category,
			eq(schema.category.id, schema.transaction.categoryId)
		)
		.leftJoin(
			schema.account,
			eq(schema.account.id, schema.transaction.accountId)
		)
		.leftJoin(
			schema.teamMember,
			and(
				eq(schema.teamMember.userId, userId),
				or(
					eq(schema.teamMember.teamId, schema.category.teamId),
					eq(schema.teamMember.teamId, schema.account.teamId)
				)
			)
		)
		.where(
			and(
				eq(schema.transaction.userId, userId),
				isNull(schema.teamMember.userId),
				isNull(schema.transaction.categoryId)
			)
		)
		.groupBy(schema.transaction.userId)
		.as('transactionSum');

	/** Sum all assigned budgets that belong to a user category. */
	const budgetSum = database
		.select({
			sum: sql<number>`coalesce(sum(${schema.budget.amount}), 0)`.as(
				'budgetSum'
			)
		})
		.from(schema.budget)
		.leftJoin(schema.category, eq(schema.category.id, schema.budget.categoryId))
		.where(
			and(eq(schema.budget.userId, userId), isNull(schema.category.teamId))
		)
		.as('budgetSum');

	/** Calculates the amount of money the user has not yet assigned to a budget. */
	const unAssigned = database
		.select({
			sum: sql<number>`coalesce(${transactionSum.sum}, 0) - coalesce(${budgetSum.sum}, 0)`.as(
				'sleepingMoney'
			)
		})
		.from(budgetSum)
		.leftJoin(transactionSum, eq(transactionSum.userId, userId))
		.get();

	return unAssigned?.sum || 0;
}

/**
 * Gets the amounts of money that is yet to be budgeted.
 * One for the user and one pro team.
 */
export function getSleepingMoney(database: Database, userId: string) {
	return {
		personal: aggregateUserSleepingMoney(database, userId),
		teams: aggregateTeamSleepingMoney(database, userId)
	};
}
