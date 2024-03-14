import { and, eq, gt, isNull, lte, ne, or, sql } from 'drizzle-orm';
import type { Database } from './db';
import { schema } from './schema';
import { getTeamRole } from './auth';
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
			budget: schema.budget.amount,
			activity: sql<number>`coalesce(sum(${schema.transaction.flow}), 0)`,
			rest: sql<number>`${budgetSumSQ.sum} + ${transactionSumSQ.sum}`
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

export function setBudget(
	database: Database,
	userId: string,
	budget: Omit<typeof schema.budget.$inferInsert, 'userId'>
) {
	return database.transaction(() => {
		const userOwnsCategory = getCategory(database, userId, budget.categoryId);
		if (!userOwnsCategory) {
			throw new Error('User does not own the category');
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

/**
 * Calculates the amount of money that is yet to be budgeted for the teams.
 *
 * @param database The database object.
 * @param userId The user ID.
 * @returns  An array of objects containing team ID, team name, and the amount of sleeping money.
 */
function aggregateTeamSleepingMoney(database: Database, userId: string) {
	/** Sums the positive transaction flows for the teams */
	const positiveTransactionSum = database
		.select({
			teamId: schema.teamMember.teamId,
			sum: sql<number>`coalesce(sum(${schema.transaction.flow}), 0)`.as(
				'positiveTransactionSum,'
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
				eq(schema.teamMember.userId, userId),
				ne(schema.teamMember.role, 'INVITED'),
				or(
					gt(schema.transaction.flow, 0),
					isNull(schema.transaction.categoryId)
				)
			)
		)
		.as('positiveTransactionSum');

	/** Sums the budget amounts for the teams */
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
		.as('budgetSum');

	/** Calculates the amount of money that is yet to be budgeted for the teams */
	const sleepingMoney = database
		.select({
			id: schema.team.id,
			name: schema.team.name,
			sum: sql<number>`coalesce(${positiveTransactionSum.sum} - ${budgetSum.sum}, 0)`.as(
				'sleepingMoney'
			)
		})
		.from(schema.team)
		.leftJoin(schema.teamMember, eq(schema.teamMember.teamId, schema.team.id))
		.leftJoin(budgetSum, eq(budgetSum.teamId, schema.team.id))
		.leftJoin(
			positiveTransactionSum,
			eq(positiveTransactionSum.teamId, schema.team.id)
		)
		.where(
			and(
				eq(schema.teamMember.userId, userId),
				ne(schema.teamMember.role, 'INVITED')
			)
		)
		.groupBy(schema.team.id)
		.all();

	return sleepingMoney;
}

/**
 * Calculates the amount of money that is yet to be budgeted for a user.
 *
 * @param database The database object.
 * @param userId The ID of the user.
 * @returns The amount of money that is yet to be budgeted.
 */
function aggregateUserSleepingMoney(database: Database, userId: string) {
	/** Sums the positive transaction flows for the user */
	const positiveTransactionSum = database
		.select({
			userId: schema.transaction.userId,
			sum: sql<number>`coalesce(sum(${schema.transaction.flow}), 0)`.as(
				'positiveTransactionSum'
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
				or(
					gt(schema.transaction.flow, 0),
					isNull(schema.transaction.categoryId)
				)
			)
		)
		.groupBy(schema.transaction.userId)
		.as('positiveTransactionSum');

	/** Sums the budget amounts for the user */
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

	/** Calculates the amount of money that is yet to be budgeted for the user */
	const sleepingMoney = database
		.select({
			sum: sql<number>`${positiveTransactionSum.sum} - ${budgetSum.sum}`.as(
				'sleepingMoney'
			)
		})
		.from(budgetSum)
		.leftJoin(positiveTransactionSum, eq(positiveTransactionSum.userId, userId))
		.get();
	return sleepingMoney;
}

/**
 * Gets the amounts of money that is yet to be budgeted.
 * One for the user and one pro team.
 *
 * @param database The database object.
 * @param userId The ID of the user.
 */
export function getSleepingMoney(database: Database, userId: string) {
	return {
		personal: aggregateUserSleepingMoney(database, userId),
		teams: aggregateTeamSleepingMoney(database, userId)
	};
}
