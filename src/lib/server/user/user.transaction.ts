import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { schema } from '../schema';
import type {
	InsertUserTransaction,
	SelectUserTransaction,
	UpdateUserTransaction
} from '../schema/tables';

const userTransactionFindFirst = db.query.userTransaction
	.findFirst({
		where: (transaction, { and, eq, sql }) => {
			return and(
				eq(transaction.id, sql.placeholder('transactionId')),
				eq(transaction.userId, sql.placeholder('userId'))
			);
		},
		with: {
			category: true,
			account: true
		}
	})
	.prepare();

const userTransactionFindMany = db.query.userTransaction
	.findMany({
		where: (transaction, { eq, sql }) => {
			return eq(transaction.userId, sql.placeholder('userId'));
		},
		with: {
			category: true,
			account: true
		}
	})
	.prepare();

export function useUserTransaction(userId: string) {
	function create(
		draft: Omit<InsertUserTransaction, 'id' | 'userId' | 'createdAt'>
	): SelectUserTransaction {
		const createdTransaction = db
			.insert(schema.userTransaction)
			.values({ userId, ...draft })
			.returning()
			.get();

		if (!createdTransaction) {
			throw new Error(`Could not create user(${userId}) transaction.`);
		}

		return createdTransaction;
	}

	function get(transactionId: number) {
		const transaction = userTransactionFindFirst.get({ transactionId, userId });

		if (!transaction) {
			throw new Error(
				`User(${userId}) transaction(${transactionId}) not found`
			);
		}

		return transaction;
	}

	function getAll() {
		return userTransactionFindMany.all({ userId });
	}

	function update(
		transactionId: number,
		updates: UpdateUserTransaction
	): SelectUserTransaction {
		const updatedTransaction = db
			.update(schema.userTransaction)
			.set(updates)
			.where(
				and(
					eq(schema.userTransaction.userId, userId),
					eq(schema.userTransaction.id, transactionId)
				)
			)
			.returning()
			.get();

		if (!updatedTransaction) {
			throw new Error(
				`Could not update user(${userId}) transaction(${transactionId}).`
			);
		}

		return updatedTransaction;
	}

	function remove(transactionId: number): SelectUserTransaction {
		const removedTransaction = db
			.delete(schema.userTransaction)
			.where(
				and(
					eq(schema.userTransaction.id, transactionId),
					eq(schema.userTransaction.userId, userId)
				)
			)
			.returning()
			.get();

		if (!removedTransaction) {
			throw new Error(
				`Could not remove user(${userId}) transaction(${transactionId}).`
			);
		}

		return removedTransaction;
	}

	return { create, get, getAll, update, remove };
}
