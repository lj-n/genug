import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { schema } from '../schema';
import type {
	InsertUserCategory,
	SelectUserCategory,
	UpdateUserCategory
} from '../schema/tables';
import { getLastMonthsNames } from '$lib/utils';

const userCategoryFindFirst = db.query.userCategory
	.findFirst({
		where: (category, { and, eq, sql }) => {
			return and(
				eq(category.id, sql.placeholder('categoryId')),
				eq(category.userId, sql.placeholder('userId'))
			);
		}
	})
	.prepare();

const userCategoryFindMany = db.query.userCategory
	.findMany({
		where: (category, { eq, sql }) => {
			return eq(category.userId, sql.placeholder('userId'));
		}
	})
	.prepare();

const userCategoryWithTransactionsFindFirst = db.query.userCategory
	.findFirst({
		where: (category, { and, eq, sql }) => {
			return and(
				eq(category.id, sql.placeholder('categoryId')),
				eq(category.userId, sql.placeholder('userId'))
			);
		},
		with: {
			transactions: true
		}
	})
	.prepare();

const userCategoryWithTransactionsFindMany = db.query.userCategory
	.findMany({
		where: (category, { eq, sql }) => {
			return eq(category.userId, sql.placeholder('userId'));
		},
		with: {
			transactions: true
		}
	})
	.prepare();

const categorySums = db
	.select({
		transactionCount: sql<number>`coalesce(count(${schema.userTransaction.flow}), 0)`,
		transactionSum: sql<number>`coalesce(sum(${schema.userTransaction.flow}), 0)`,
		budgetSum: sql<number>`coalesce(sum(${schema.userBudget.amount}), 0)`
	})
	.from(schema.userCategory)
	.leftJoin(
		schema.userTransaction,
		eq(schema.userTransaction.categoryId, schema.userCategory.id)
	)
	.leftJoin(
		schema.userBudget,
		eq(schema.userBudget.categoryId, schema.userCategory.id)
	)
	.where(
		and(
			eq(schema.userCategory.userId, sql.placeholder('userId')),
			eq(schema.userCategory.id, sql.placeholder('categoryId'))
		)
	)
	.prepare();

const transactionSumAndCountForMonth = db
	.select({
		sum: sql<number>`coalesce(sum(${schema.userTransaction.flow}), 0)`,
		count: sql<number>`coalesce(count(${schema.userTransaction.flow}), 0)`
	})
	.from(schema.userTransaction)
	.where(
		and(
			eq(schema.userTransaction.userId, sql.placeholder('userId')),
			eq(schema.userTransaction.categoryId, sql.placeholder('categoryId')),
			eq(
				sql`strftime('%Y-%m', ${schema.userTransaction.date})`,
				sql.placeholder('month')
			)
		)
	)
	.prepare();

export function useUserCategory(userId: string) {
	function create(
		draft: Omit<InsertUserCategory, 'userId' | 'id' | 'createdAt'>
	): SelectUserCategory {
		const createdCategory = db
			.insert(schema.userCategory)
			.values({ userId, ...draft })
			.returning()
			.get();

		if (!createdCategory) {
			throw new Error(`Could not create user(${userId}) category.`);
		}

		return createdCategory;
	}

	function get(categoryId: number) {
		return userCategoryFindFirst.get({ categoryId, userId });
	}

	function getDetailed(categoryId: number) {
		const category = get(categoryId);
		const sums = categorySums.get({ userId, categoryId });
		const lastMonths = getLastMonthsNames(12)
			.reverse()
			.map(({ date, name }) => ({
				name,
        date,
				...transactionSumAndCountForMonth.get({
					month: date,
					userId,
					categoryId
				})
			}));
		return category && sums && { ...category, ...sums, lastMonths };
	}

	function getWithTransactions(categoryId: number) {
		return userCategoryWithTransactionsFindFirst.get({
			categoryId,
			userId
		});
	}

	function getAll() {
		return userCategoryFindMany.all({ userId });
	}

	function getAllWithTransactions() {
		return userCategoryWithTransactionsFindMany.all({ userId });
	}

	function update(
		categoryId: number,
		updates: UpdateUserCategory
	): SelectUserCategory {
		const updatedCategory = db
			.update(schema.userCategory)
			.set(updates)
			.where(
				and(
					eq(schema.userCategory.userId, userId),
					eq(schema.userCategory.id, categoryId)
				)
			)
			.returning()
			.get();

		if (!updatedCategory) {
			throw new Error(
				`Could not update user(${userId}) category(${categoryId}).`
			);
		}

		return updatedCategory;
	}

	function remove(categoryId: number): SelectUserCategory {
		const removedCategory = db
			.delete(schema.userCategory)
			.where(
				and(
					eq(schema.userCategory.id, categoryId),
					eq(schema.userCategory.userId, userId)
				)
			)
			.returning()
			.get();

		if (!removedCategory) {
			throw new Error(
				`Could not remove user(${userId}) category(${categoryId}).`
			);
		}

		return removedCategory;
	}

	return {
		create,
		get,
		getDetailed,
		getWithTransactions,
		getAll,
		getAllWithTransactions,
		update,
		remove
	};
}
