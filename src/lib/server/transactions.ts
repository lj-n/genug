import { z } from 'zod';
import { zfd } from 'zod-form-data';
import type { Database } from './db';
import { schema } from './schema';
import { SQL, and, asc, desc, eq, inArray, ne, or } from 'drizzle-orm';

/** The schema for parsing the searchParams on the transactions page. */
export const transactionFilterSchema = zfd.formData({
	limit: zfd.numeric(
		z.number().int().positive().optional().default(30).catch(30)
	),
	offset: zfd.numeric(
		z.number().int().nonnegative().optional().default(0).catch(0)
	),
	page: zfd.numeric(z.number().int().positive().optional().default(1).catch(1)),
	accounts: zfd
		.repeatableOfType(zfd.numeric(z.number().int().positive()))
		.catch([]),
	categories: zfd
		.repeatableOfType(zfd.numeric(z.number().int().positive()))
		.catch([]),
	teams: zfd
		.repeatableOfType(zfd.numeric(z.number().int().positive()))
		.catch([])
});

/** Get transactions for a user. Filtered by parsed searchParams. */
export function getTransactions(
	database: Database,
	userId: string,
	filter: z.infer<typeof transactionFilterSchema>
) {
	const where: (SQL | undefined)[] = [];

	if (filter.accounts.length > 0) {
		where.push(inArray(schema.transaction.accountId, filter.accounts));
	}
	if (filter.categories.length > 0) {
		where.push(inArray(schema.transaction.categoryId, filter.categories));
	}
	if (filter.teams.length > 0) {
		where.push(
			or(
				inArray(schema.category.teamId, filter.teams),
				inArray(schema.account.teamId, filter.teams)
			)
		);
	}

	/** TODO: accept order from frontend */
	const order: SQL[] = [
		asc(schema.transaction.validated),
		desc(schema.transaction.date),
		desc(schema.transaction.createdAt)
	];

	const result = database
		.select({
			id: schema.transaction.id,
			date: schema.transaction.date,
			description: schema.transaction.description,
			flow: schema.transaction.flow,
			validated: schema.transaction.validated,
			createdAt: schema.transaction.createdAt,
			account: schema.account,
			category: schema.category,
			team: schema.team
		})
		.from(schema.transaction)
		.leftJoin(
			schema.account,
			eq(schema.transaction.accountId, schema.account.id)
		)
		.leftJoin(
			schema.category,
			eq(schema.transaction.categoryId, schema.category.id)
		)
		.leftJoin(
			schema.team,
			or(
				eq(schema.account.teamId, schema.team.id),
				eq(schema.category.teamId, schema.team.id)
			)
		)
		.leftJoin(schema.teamMember, eq(schema.teamMember.teamId, schema.team.id))
		.where(
			and(
				or(
					eq(schema.transaction.userId, userId),
					and(
						eq(schema.teamMember.userId, userId),
						ne(schema.teamMember.role, 'INVITED')
					)
				),
				...where
			)
		)
		.orderBy(...order)
		.limit(filter.limit)
		.offset((filter.page - 1) * filter.limit)
		.all();
	return result;
}

export function getTransaction(
	database: Database,
	userId: string,
	transactionId: number
) {
	return database
		.select({
			id: schema.transaction.id,
			date: schema.transaction.date,
			description: schema.transaction.description,
			flow: schema.transaction.flow,
			validated: schema.transaction.validated,
			createdAt: schema.transaction.createdAt,
			account: schema.account,
			category: schema.category,
			team: schema.team
		})
		.from(schema.transaction)
		.leftJoin(
			schema.account,
			eq(schema.account.id, schema.transaction.accountId)
		)
		.leftJoin(
			schema.category,
			eq(schema.category.id, schema.transaction.categoryId)
		)
		.leftJoin(
			schema.team,
			or(
				eq(schema.account.teamId, schema.team.id),
				eq(schema.category.teamId, schema.team.id)
			)
		)
		.leftJoin(schema.teamMember, eq(schema.teamMember.teamId, schema.team.id))
		.where(
			and(
				eq(schema.transaction.id, transactionId),
				or(
					eq(schema.transaction.userId, userId),
					and(
						eq(schema.teamMember.userId, userId),
						ne(schema.teamMember.role, 'INVITED')
					)
				)
			)
		)
		.get();
}

export class TransactionNotAllowedError extends Error {}

/**
 * @throws {TransactionNotAllowedError} If category and account do not belong to the same team (or user).
 */
export function updateTransaction(
	database: Database,
	userId: string,
	transactionId: number,
	update: Partial<
		Omit<typeof schema.transaction.$inferInsert, 'id' | 'userId' | 'createdAt'>
	>
) {
	return database.transaction(() => {
		const transaction = getTransaction(database, userId, transactionId);

		if (!transaction) throw new Error('Transaction not found');

		const updatedTransaction = database
			.update(schema.transaction)
			.set({ userId, ...update })
			.where(eq(schema.transaction.id, transactionId))
			.returning()
			.get();

		checkIfTransactionIsAllowed(database, userId, updatedTransaction);

		return updatedTransaction;
	});
}

/**
 * Checks if category and account belong to the same team (or user).
 * @throws {TransactionNotAllowedError} If category and account do not belong to the same team (or user).
 */
export function checkIfTransactionIsAllowed(
	database: Database,
	userId: string,
	transaction: typeof schema.transaction.$inferSelect
) {
	if (!transaction.categoryId) return;

	const account = database
		.select({
			teamId: schema.account.teamId
		})
		.from(schema.account)
		.leftJoin(
			schema.teamMember,
			eq(schema.teamMember.teamId, schema.account.teamId)
		)
		.where(
			and(
				eq(schema.account.id, transaction.accountId),
				or(
					eq(schema.account.userId, userId),
					and(
						eq(schema.teamMember.userId, userId),
						ne(schema.teamMember.role, 'INVITED')
					)
				)
			)
		)
		.get();

	const category = database
		.select({
			teamId: schema.category.teamId
		})
		.from(schema.category)
		.leftJoin(
			schema.teamMember,
			eq(schema.teamMember.teamId, schema.category.teamId)
		)
		.where(
			and(
				eq(schema.category.id, transaction.categoryId),
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

	if (account?.teamId !== category?.teamId) {
		throw new TransactionNotAllowedError(
			'Category and account must belong to the same team'
		);
	}
}
