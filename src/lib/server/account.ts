import { and, eq } from 'drizzle-orm';
import { db } from './db';
import { schema } from './schema';
import type {
	InsertUserAccount,
	InsertUserTransaction,
	SelectUserAccount,
	SelectUserTransaction
} from './schema/tables';

export class UserAccount {
	userId: string;

	constructor(userId: string) {
		this.userId = userId;
	}

	get(id: number): SelectUserAccount {
		const account = accountQuery.get({
			userId: this.userId,
			accountId: id
		});

		if (!account) {
			throw new Error(`User(${this.userId}) account(${id}) not found.`);
		}

		return account;
	}

	getWithTransactions(id: number) {
		const account = accountWithTransactionsQuery.get({
			userId: this.userId,
			accountId: id
		});

		if (!account) {
			throw new Error(`User(${this.userId}) account(${id}) not found.`);
		}

		return account;
	}

	getAll() {
		return accountsQuery.all({ userId: this.userId });
	}

	getAllWithTransactions() {
		return accountsWithTransactionsQuery.all({ userId: this.userId });
	}

	create(
		draft: Omit<InsertUserAccount, 'id' | 'userId' | 'createdAt'>
	): SelectUserAccount {
		const account = db
			.insert(schema.userAccount)
			.values({ userId: this.userId, ...draft })
			.returning()
			.get();

		if (!account) {
			throw new Error(`Could not create user(${this.userId}) account.`);
		}

		return account;
	}

	update(
		id: number,
		updates: Partial<Omit<InsertUserAccount, 'id' | 'userId' | 'createdAt'>>
	): SelectUserAccount {
		const account = db
			.update(schema.userAccount)
			.set(updates)
			.where(
				and(
					eq(schema.userAccount.userId, this.userId),
					eq(schema.userAccount.id, id)
				)
			)
			.returning()
			.get();

		if (!account) {
			throw new Error(`Could not update user(${this.userId}) account(${id}).`);
		}

		return account;
	}

	delete(id: number): SelectUserAccount {
		const account = db
			.delete(schema.userAccount)
			.where(
				and(
					eq(schema.userAccount.id, id),
					eq(schema.userAccount.userId, this.userId)
				)
			)
			.returning()
			.get();

		if (!account) {
			throw new Error(`Could not delete user(${this.userId}) account(${id}).`);
		}

		return account;
	}

	addTransactionToBalance(
		accountId: number,
		transaction: Pick<InsertUserTransaction, 'validated' | 'flow'>
	): SelectUserAccount {
		const account = this.get(accountId);

		if (transaction.validated) {
			account.balanceValidated += transaction.flow;
		} else {
			account.balanceUnvalidated += transaction.flow;
		}
		account.balanceWorking += transaction.flow;

		return this.update(accountId, account);
	}

	removeTransactionFromBalance(
		accountId: number,
		transaction: Pick<SelectUserTransaction, 'validated' | 'flow'>
	): SelectUserAccount {
		const account = this.get(accountId);

		if (transaction.validated) {
			account.balanceValidated -= transaction.flow;
		} else {
			account.balanceUnvalidated -= transaction.flow;
		}
		account.balanceWorking -= transaction.flow;

		return this.update(accountId, account);
	}

	updateTransactionInBalance(
		accountId: number,
		fromTransaction: SelectUserTransaction,
		toTransaction: SelectUserTransaction
	): SelectUserAccount {
		this.removeTransactionFromBalance(accountId, fromTransaction);
		this.addTransactionToBalance(accountId, toTransaction);
		return this.get(accountId);
	}
}

const accountQuery = db.query.userAccount
	.findFirst({
		where: (account, { and, eq, sql }) => {
			return and(
				eq(account.userId, sql.placeholder('userId')),
				eq(account.id, sql.placeholder('accountId'))
			);
		}
	})
	.prepare();

const accountWithTransactionsQuery = db.query.userAccount
	.findFirst({
		where: (account, { and, eq, sql }) => {
			return and(
				eq(account.userId, sql.placeholder('userId')),
				eq(account.id, sql.placeholder('accountId'))
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

const accountsQuery = db.query.userAccount
	.findMany({
		where: (account, { eq, sql }) => {
			return eq(account.userId, sql.placeholder('userId'));
		}
	})
	.prepare();

const accountsWithTransactionsQuery = db.query.userAccount
	.findMany({
		where: (account, { eq, sql }) => {
			return eq(account.userId, sql.placeholder('userId'));
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
