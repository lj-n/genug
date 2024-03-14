import { and, eq, ne, or, sql } from 'drizzle-orm';
import type { Database } from './db';
import { schema } from './schema';
import { getTeamRole } from './auth';

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
) {
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

export function getCategoryDetails(database: Database, categoryId: number) {
	const transactionSQ = database
		.select({
			id: schema.transaction.categoryId,
			count: sql<number>`coalesce(count(${schema.transaction.id}), 0)`.as(
				'transactionCount'
			),
			sum: sql<number>`coalesce(sum(${schema.transaction.flow}), 0)`.as(
				'transactionSum'
			)
		})
		.from(schema.transaction)
		.groupBy(schema.transaction.categoryId)
		.as('transactionSQ');

	const budgetSQ = database
		.select({
			id: schema.budget.categoryId,
			sum: sql<number>`coalesce(sum(${schema.budget.amount}), 0)`.as(
				'budgetSum'
			)
		})
		.from(schema.budget)
		.groupBy(schema.budget.categoryId)
		.as('budgetSQ');

	const result = database
		.select({
			transactionCount: transactionSQ.count,
			transactionSum: transactionSQ.sum,
			budgetSum: budgetSQ.sum
		})
		.from(transactionSQ)
		.leftJoin(budgetSQ, eq(budgetSQ.id, categoryId))
		.where(eq(transactionSQ.id, categoryId))
		.get();

	return result || { transactionCount: 0, transactionSum: 0, budgetSum: 0 };
}
