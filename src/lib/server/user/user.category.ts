import { and, eq } from 'drizzle-orm';
import { db } from '..';
import { schema } from '../schema';
import type {
	InsertUserCategory,
	SelectUserCategory,
	UpdateUserCategory
} from '../schema/tables';

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

	function get(categoryId: number): SelectUserCategory {
		const category = userCategoryFindFirst.get({ categoryId, userId });

		if (!category) {
			throw new Error(`User(${userId}) category(${categoryId}) not found`);
		}

		return category;
	}

	function getWithTransactions(categoryId: number) {
		const category = userCategoryWithTransactionsFindFirst.get({
			categoryId,
			userId
		});

		if (!category) {
			throw new Error(`User(${userId}) category(${categoryId}) not found`);
		}

		return category;
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
		getWithTransactions,
		getAll,
		getAllWithTransactions,
		update,
		remove
	};
}
