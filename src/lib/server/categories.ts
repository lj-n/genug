import { and, eq, gte, ne, or, sql } from 'drizzle-orm';
import type { Database } from './db';
import { schema } from './schema';
import { getTeamRole } from './teams';
import { getPreviousMonthsWithNames } from '$lib/components/date.utils';

export function getCategory(
	database: Database,
	userId: string,
	categoryId: number
): typeof schema.category.$inferSelect | null {
	const found = database
		.select({ category: schema.category })
		.from(schema.category)
		.leftJoin(
			schema.teamMember,
			eq(schema.teamMember.teamId, schema.category.teamId)
		)
		.where(
			and(
				eq(schema.category.id, categoryId),
				or(
					eq(schema.category.userId, userId),
					and(
						eq(schema.teamMember.userId, userId),
						ne(schema.teamMember.role, 'INVITED')
					)
				)
			)
		)
		.get();

	return found?.category ?? null;
}

export function updateCategory(
	database: Database,
	userId: string,
	categoryId: number,
	update: Partial<
		Omit<
			typeof schema.category.$inferSelect,
			'id' | 'createdAt' | 'userId' | 'teamId'
		>
	>
): typeof schema.account.$inferSelect {
	return database.transaction(() => {
		const category = getCategory(database, userId, categoryId);

		if (!category) {
			throw new Error('Category not found');
		}

		if (
			category.teamId &&
			getTeamRole(database, category.teamId, userId) !== 'OWNER'
		) {
			throw new Error('Must be team owner');
		}

		return database
			.update(schema.category)
			.set(update)
			.where(eq(schema.category.id, categoryId))
			.returning()
			.get();
	});
}

/** Sorts the categories based on the users preferences. */
export function sortCategories<Category extends { id: number }>(
	database: Database,
	userId: string,
	categories: Category[]
): Category[] {
	const profile = database
		.select()
		.from(schema.userSettings)
		.where(eq(schema.userSettings.userId, userId))
		.get();

	if (profile?.categoryOrder) {
		const order = profile.categoryOrder;
		categories.sort((a, b) => {
			return order.indexOf(a.id) - order.indexOf(b.id);
		});
	}

	return categories;
}

export function getCategories(
	database: Database,
	userId: string,
	withRetired = false
): Array<
	Omit<typeof schema.category.$inferSelect, 'userId' | 'teamId'> & {
		team: typeof schema.team.$inferSelect | null;
	}
> {
	const filter = [
		or(
			eq(schema.category.userId, userId),
			and(
				eq(schema.teamMember.userId, userId),
				ne(schema.teamMember.role, 'INVITED')
			)
		)
	];

	if (!withRetired) {
		filter.push(ne(schema.category.retired, true));
	}

	const categories = database
		.select({
			id: schema.category.id,
			name: schema.category.name,
			description: schema.category.description,
			goal: schema.category.goal,
			createdAt: schema.category.createdAt,
			retired: schema.category.retired,
			team: schema.team
		})
		.from(schema.category)
		.leftJoin(
			schema.teamMember,
			eq(schema.teamMember.teamId, schema.category.teamId)
		)
		.leftJoin(schema.team, eq(schema.team.id, schema.category.teamId))
		.where(and(...filter))
		.groupBy(schema.category.id)
		.all();

	return sortCategories(database, userId, categories);
}

export function getCategoryDetails(
	database: Database,
	categoryId: number
): {
	transactionCount: number;
	transactionSum: number;
	budgetSum: number;
} {
	const transactionSQ = database
		.select({
			categoryId: schema.transaction.categoryId,
			transactionCount:
				sql<number>`coalesce(count(${schema.transaction.id}), 0)`.as(
					'transactionCount'
				),
			transactionSum:
				sql<number>`coalesce(sum(${schema.transaction.flow}), 0)`.as(
					'transactionSum'
				)
		})
		.from(schema.transaction)
		.where(eq(schema.transaction.categoryId, categoryId))
		.groupBy(schema.transaction.categoryId)
		.as('transactionSQ');

	const budgetSQ = database
		.select({
			categoryId: schema.budget.categoryId,
			budgetSum: sql<number>`coalesce(sum(${schema.budget.amount}), 0)`.as(
				'budgetSum'
			)
		})
		.from(schema.budget)
		.where(eq(schema.budget.categoryId, categoryId))
		.groupBy(schema.budget.categoryId)
		.as('budgetSQ');

	const result = database
		.select({
			transactionCount: transactionSQ.transactionCount,
			transactionSum: transactionSQ.transactionSum,
			budgetSum: budgetSQ.budgetSum
		})
		.from(transactionSQ)
		.leftJoin(budgetSQ, eq(transactionSQ.categoryId, budgetSQ.categoryId))
		.get();

	return result || { transactionCount: 0, transactionSum: 0, budgetSum: 0 };
}

export function getCategoryLastMonthStats(
	database: Database,
	categoryId: number
) {
	const lastMonthNames = getPreviousMonthsWithNames(12);

	const result = database
		.select({
			month: sql<string>`strftime('%Y-%m', ${schema.transaction.date})`.as(
				'month'
			),
			total: sql<number>`coalesce(sum(${schema.transaction.flow}), 0)`.as(
				'total'
			)
		})
		.from(schema.transaction)
		.where(
			and(
				eq(schema.transaction.categoryId, categoryId),
				gte(schema.transaction.date, sql`date('now', '-12 month')`)
			)
		)
		.groupBy(sql`strftime('%Y-%m', ${schema.transaction.date})`)
		.orderBy(sql`month`)
		.all();

	return lastMonthNames.map(({ date, name }) => {
		const found = result.find((r) => r.month === date);
		return {
			date,
			name,
			total: found?.total ?? 0
		};
	});
}
