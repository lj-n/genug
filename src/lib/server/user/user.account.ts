import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { schema } from '../schema';
import type {
	InsertUserAccount,
	SelectUserAccount,
	UpdateUserAccount
} from '../schema/tables';

const userAccountFindFirst = db.query.userAccount
	.findFirst({
		where: (account, { and, eq, sql }) => {
			return and(
				eq(account.id, sql.placeholder('accountId')),
				eq(account.userId, sql.placeholder('userId'))
			);
		}
	})
	.prepare();

const userAccountFindMany = db.query.userAccount
	.findMany({
		where: (account, { eq, sql }) => {
			return eq(account.userId, sql.placeholder('userId'));
		}
	})
	.prepare();

const userAccountWithTransactionsFindFirst = db.query.userAccount
	.findFirst({
		where: (account, { and, eq, sql }) => {
			return and(
				eq(account.id, sql.placeholder('accountId')),
				eq(account.userId, sql.placeholder('userId'))
			);
		},
		with: {
			transactions: true
		}
	})
	.prepare();

const userAccountWithTransactionsFindMany = db.query.userAccount
	.findMany({
		where: (account, { eq, sql }) => {
			return eq(account.userId, sql.placeholder('userId'));
		},
		with: {
			transactions: true
		}
	})
	.prepare();

const userAccountBalanceQuery = db
	.select({
		validated: sql<number>`coalesce(sum(CASE WHEN ${schema.userTransaction.validated} = 1 THEN ${schema.userTransaction.flow} ELSE 0 END) ,0)`,
		pending: sql<number>`coalesce(sum(CASE WHEN ${schema.userTransaction.validated} = 0 THEN ${schema.userTransaction.flow} ELSE 0 END) ,0)`
	})
	.from(schema.userTransaction)
	.where(
		and(
			eq(schema.userTransaction.accountId, sql.placeholder('accountId')),
			eq(schema.userTransaction.userId, sql.placeholder('userId'))
		)
	)
	.prepare();

const userAccountBalanceAllQuery = db
	.select({
		accountId: schema.userAccount.id,
		validated: sql<number>`coalesce(sum(CASE WHEN ${schema.userTransaction.validated} = 1 THEN ${schema.userTransaction.flow} ELSE 0 END) ,0)`,
		pending: sql<number>`coalesce(sum(CASE WHEN ${schema.userTransaction.validated} = 0 THEN ${schema.userTransaction.flow} ELSE 0 END) ,0)`
	})
	.from(schema.userAccount)
	.leftJoin(
		schema.userTransaction,
		eq(schema.userTransaction.accountId, schema.userAccount.id)
	)
	.where(eq(schema.userAccount.userId, sql.placeholder('userId')))
	.groupBy(({ accountId }) => accountId)
	.prepare();

export function useUserAccount(userId: string) {
	function create(
		draft: Omit<InsertUserAccount, 'userId' | 'id' | 'createdAt'>
	): SelectUserAccount {
		const createdAccount = db
			.insert(schema.userAccount)
			.values({ userId, ...draft })
			.returning()
			.get();

		if (!createdAccount) {
			throw new Error(`Could not create user(${userId}) account.`);
		}

		return createdAccount;
	}

	function get(accountId: number): SelectUserAccount {
		const account = userAccountFindFirst.get({ accountId, userId });

		if (!account) {
			throw new Error(`User(${userId}) account(${accountId}) not found`);
		}

		return account;
	}

	function getWithTransactions(accountId: number) {
		const account = userAccountWithTransactionsFindFirst.get({
			accountId,
			userId
		});

		if (!account) {
			throw new Error(`User(${userId}) account(${accountId}) not found`);
		}

		return account;
	}

	function getAll() {
		return userAccountFindMany.all({ userId });
	}

	function getAllWithTransactions() {
		return userAccountWithTransactionsFindMany.all({ userId });
	}

	function getBalance(accountId: number) {
		const balance = userAccountBalanceQuery.get({ accountId, userId });

		if (!balance) {
			throw new Error(`User(${userId}) account(${accountId}) not found`);
		}

		return balance;
	}

	function getBalances() {
		return userAccountBalanceAllQuery.all({ userId });
	}

	function update(
		accountId: number,
		updates: UpdateUserAccount
	): SelectUserAccount {
		const updatedAccount = db
			.update(schema.userAccount)
			.set(updates)
			.where(
				and(
					eq(schema.userAccount.userId, userId),
					eq(schema.userAccount.id, accountId)
				)
			)
			.returning()
			.get();

		if (!updatedAccount) {
			throw new Error(
				`Could not update user(${userId}) account(${accountId}).`
			);
		}

		return updatedAccount;
	}

	function remove(accountId: number): SelectUserAccount {
		const removedAccount = db
			.delete(schema.userAccount)
			.where(
				and(
					eq(schema.userAccount.id, accountId),
					eq(schema.userAccount.userId, userId)
				)
			)
			.returning()
			.get();

		if (!removedAccount) {
			throw new Error(
				`Could not remove user(${userId}) account(${accountId}).`
			);
		}

		return removedAccount;
	}

	return {
		create,
		get,
		getWithTransactions,
		getAll,
		getAllWithTransactions,
		getBalance,
		getBalances,
		update,
		remove
	};
}
