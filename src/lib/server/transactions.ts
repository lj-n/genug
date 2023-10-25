import { and, eq } from 'drizzle-orm';
import { db } from './db';
import { schema } from './schema';
import type { UserAccounts } from './accounts';
import type { InsertUserTransaction, UserTransaction } from './schema/tables';

const transactionQuery = db.query.userTransaction
	.findFirst({
		where: (transaction, { and, eq, sql }) => {
			return and(
				eq(transaction.userId, sql.placeholder('userId')),
				eq(transaction.id, sql.placeholder('transactionId'))
			);
		},
		with: {
			account: {
				columns: {
					userId: false
				}
			},
			category: {
				columns: {
					userId: false
				}
			}
		}
	})
	.prepare();

const transactionsQuery = db.query.userTransaction
	.findMany({
		where: (transaction, { eq, sql }) => {
			return eq(transaction.userId, sql.placeholder('userId'));
		},
		with: {
			account: {
				columns: {
					userId: false
				}
			},
			category: {
				columns: {
					userId: false
				}
			}
		}
	})
	.prepare();

type QueryTransaction = NonNullable<ReturnType<typeof transactionQuery.get>>;

export class UserTransactions {
	userId: string;
	accounts: UserAccounts;

	constructor(userId: string, accounts: UserAccounts) {
		this.userId = userId;
		this.accounts = accounts;
	}

	get(id: number): QueryTransaction {
		const transaction = transactionQuery.get({
			userId: this.userId,
			transactionId: id
		});

		if (!transaction) {
			throw new Error(`User(${this.userId}) transaction(${id}) not found.`);
		}

		return transaction;
	}

	getAll(): QueryTransaction[] {
		return transactionsQuery.all({ userId: this.userId });
	}

	create(
		draft: Omit<InsertUserTransaction, 'id' | 'userId' | 'createdAt'>
	): UserTransaction {
		return db.transaction(() => {
			/** Update account balances */
			this.accounts.addTransactionToBalance(draft.accountId, draft);

			const transaction = db
				.insert(schema.userTransaction)
				.values({ userId: this.userId, ...draft })
				.returning()
				.get();

			if (!transaction) {
				throw new Error(`Could not create user(${this.userId}) transaction.`);
			}

			return transaction;
		});
	}

	update(id: number, to: UserTransaction): UserTransaction {
		return db.transaction(() => {
			const from = this.get(id);

			const accountChanged = from.accountId !== to.accountId;
			const validatedChanged = from.validated !== to.validated;
			const flowChanged = from.flow !== to.flow;

			if (accountChanged) {
				this.accounts.removeTransactionFromBalance(from.account.id, from);
				this.accounts.addTransactionToBalance(to.accountId, to);
			} else if (flowChanged || validatedChanged) {
				this.accounts.updateTransactionInBalance(from.accountId, from, to);
			}

			const transaction = db
				.update(schema.userTransaction)
				.set(to)
				.where(
					and(
						eq(schema.userTransaction.userId, this.userId),
						eq(schema.userTransaction.id, id)
					)
				)
				.returning()
				.get();

			if (!transaction) {
				throw new Error(
					`Could not update user(${this.userId}) transaction(${id}).`
				);
			}

			return transaction;
		});
	}

	delete(id: number): UserTransaction {
		return db.transaction(() => {
			const transaction = this.get(id);

			this.accounts.removeTransactionFromBalance(
				transaction.accountId,
				transaction
			);

			const deletedTransaction = db
				.delete(schema.userTransaction)
				.where(eq(schema.userTransaction.id, id))
				.returning()
				.get();

			if (!deletedTransaction) {
				throw new Error(
					`Could not delete user(${this.userId}) transaction(${id}).`
				);
			}

			return deletedTransaction;
		});
	}
}
