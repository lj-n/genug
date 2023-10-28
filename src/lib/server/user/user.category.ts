import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { schema } from '../schema';
import type { InsertUserCategory, SelectUserCategory } from '../schema/tables';

export class UserCategory {
	userId: string;

	constructor(userId: string) {
		this.userId = userId;
	}

	get(id: number): SelectUserCategory {
		const category = categoryQuery.get({
			userId: this.userId,
			categoryId: id
		});

		if (!category) {
			throw new Error(`User(${this.userId}) category(${id}) not found.`);
		}

		return category;
	}

	getWithTransactions(id: number) {
		const category = categoryWithTransactionsQuery.get({
			userId: this.userId,
			categoryId: id
		});

		if (!category) {
			throw new Error(`User(${this.userId}) category(${id}) not found.`);
		}

		return category;
	}

	getAll() {
		return categoriesQuery.all({ userId: this.userId });
	}

	getAllWithTransactions() {
		return categoriesWithTransactionsQuery.all({ userId: this.userId });
	}

	create(
		draft: Omit<InsertUserCategory, 'id' | 'userId' | 'createdAt'>
	): SelectUserCategory {
		const category = db
			.insert(schema.userCategory)
			.values({ userId: this.userId, ...draft })
			.returning()
			.get();

		if (!category) {
			throw new Error(`Could not create user(${this.userId}) category.`);
		}

		return category;
	}

	update(
		id: number,
		updates: Partial<Omit<InsertUserCategory, 'id' | 'userId' | 'createdAt'>>
	): SelectUserCategory {
		const category = db
			.update(schema.userCategory)
			.set(updates)
			.where(
				and(
					eq(schema.userCategory.userId, this.userId),
					eq(schema.userCategory.id, id)
				)
			)
			.returning()
			.get();

		if (!category) {
			throw new Error(`Could not update user(${this.userId}) category(${id}).`);
		}

		return category;
	}

	delete(id: number): SelectUserCategory {
		const category = db
			.delete(schema.userCategory)
			.where(
				and(
					eq(schema.userCategory.id, id),
					eq(schema.userCategory.userId, this.userId)
				)
			)
			.returning()
			.get();

		if (!category) {
			throw new Error(`Could not delete user(${this.userId}) category(${id}).`);
		}

		return category;
	}
}

const categoryQuery = db.query.userCategory
	.findFirst({
		where: (category, { and, eq, sql }) => {
			return and(
				eq(category.userId, sql.placeholder('userId')),
				eq(category.id, sql.placeholder('categoryId'))
			);
		}
	})
	.prepare();

const categoryWithTransactionsQuery = db.query.userCategory
	.findFirst({
		where: (category, { and, eq, sql }) => {
			return and(
				eq(category.userId, sql.placeholder('userId')),
				eq(category.id, sql.placeholder('categoryId'))
			);
		},
		with: {
			transactions: {
				columns: {
					accountId: false,
					userId: false
				},
				with: {
					account: {
						columns: {
							userId: false
						}
					}
				}
			}
		}
	})
	.prepare();

const categoriesQuery = db.query.userCategory
	.findMany({
		where: (category, { eq, sql }) => {
			return eq(category.userId, sql.placeholder('userId'));
		}
	})
	.prepare();

const categoriesWithTransactionsQuery = db.query.userCategory
	.findMany({
		where: (category, { eq, sql }) => {
			return eq(category.userId, sql.placeholder('userId'));
		},
		with: {
			transactions: {
				columns: {
					accountId: false,
					userId: false
				},
				with: {
					account: {
						columns: {
							userId: false
						}
					}
				}
			}
		}
	})
	.prepare();
