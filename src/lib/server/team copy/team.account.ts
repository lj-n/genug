import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { schema } from '../schema';
import type { InsertTeamAccount, SelectTeamAccount } from '../schema/tables';

const teamAccountFindFirst = db.query.teamAccount
	.findFirst({
		where: (account, { and, eq, sql }) => {
			return and(
				eq(account.id, sql.placeholder('accountId')),
				eq(account.teamId, sql.placeholder('teamId'))
			);
		}
	})
	.prepare();

const teamAccountFindMany = db.query.teamAccount
	.findMany({
		where: (account, { eq, sql }) => {
			return eq(account.teamId, sql.placeholder('teamId'));
		}
	})
	.prepare();

const teamAccountWithTransactionsFindFirst = db.query.teamAccount
	.findFirst({
		where: (account, { and, eq, sql }) => {
			return and(
				eq(account.id, sql.placeholder('accountId')),
				eq(account.teamId, sql.placeholder('teamId'))
			);
		},
		with: {
			transactions: true
		}
	})
	.prepare();

const teamAccountWithTransactionsFindMany = db.query.teamAccount
	.findMany({
		where: (account, { eq, sql }) => {
			return eq(account.teamId, sql.placeholder('teamId'));
		},
		with: {
			transactions: true
		}
	})
	.prepare();

const teamAccountBalanceQuery = db
	.select({
		validated: sql<number>`coalesce(sum(CASE WHEN ${schema.teamTransaction.validated} = 1 THEN ${schema.teamTransaction.flow} ELSE 0 END), 0)`,
		pending: sql<number>`coalesce(sum(CASE WHEN ${schema.teamTransaction.validated} = 0 THEN ${schema.teamTransaction.flow} ELSE 0 END), 0)`
	})
	.from(schema.teamTransaction)
	.where(
		and(
			eq(schema.teamTransaction.accountId, sql.placeholder('accountId')),
			eq(schema.teamTransaction.teamId, sql.placeholder('teamId'))
		)
	)
	.prepare();

const teamAccountBalanceAllQuery = db
	.select({
		account: schema.teamAccount,
		validated: sql<number>`coalesce(sum(CASE WHEN ${schema.teamTransaction.validated} = 1 THEN ${schema.teamTransaction.flow} ELSE 0 END), 0)`,
		pending: sql<number>`coalesce(sum(CASE WHEN ${schema.teamTransaction.validated} = 0 THEN ${schema.teamTransaction.flow} ELSE 0 END), 0)`
	})
	.from(schema.teamAccount)
	.leftJoin(
		schema.teamTransaction,
		eq(schema.teamTransaction.accountId, schema.teamAccount.id)
	)
	.where(eq(schema.teamAccount.teamId, sql.placeholder('teamId')))
	.groupBy(({ account }) => account.id)
	.prepare();

export function useTeamAccount(teamId: number) {
	function create(
		draft: Pick<InsertTeamAccount, 'name' | 'description' | 'createdBy'>
	): SelectTeamAccount {
		const createdAccount = db
			.insert(schema.teamAccount)
			.values({ teamId, ...draft })
			.returning()
			.get();

		if (!createdAccount) {
			throw new Error(`Could not create team(${teamId}) account.`);
		}

		return createdAccount;
	}

	function get(accountId: number) {
		const account = teamAccountFindFirst.get({ accountId, teamId });

		if (!account) {
			throw new Error(`Team(${teamId}) account(${accountId}) not found`);
		}

		return account;
	}

	function getWithTransactions(accountId: number) {
		const account = teamAccountWithTransactionsFindFirst.get({
			accountId,
			teamId
		});

		if (!account) {
			throw new Error(`Team(${teamId}) account(${accountId}) not found`);
		}

		return account;
	}

	function getAll() {
		return teamAccountFindMany.all({ teamId });
	}

	function getAllWithTransactions() {
		return teamAccountWithTransactionsFindMany.all({ teamId });
	}

	function getBalance(accountId: number) {
		const balance = teamAccountBalanceQuery.get({ accountId, teamId });

		if (!balance) {
			throw new Error(`Team(${teamId}) account(${accountId}) not found`);
		}

		return balance;
	}

	function getBalances() {
		return teamAccountBalanceAllQuery
			.all({ teamId })
			.map(({ account, ...balances }) => ({ ...account, ...balances }));
	}

	function update(
		accountId: number,
		updates: Pick<InsertTeamAccount, 'name' | 'description'>
	): SelectTeamAccount {
		const updatedAccount = db
			.update(schema.teamAccount)
			.set(updates)
			.where(
				and(
					eq(schema.teamAccount.teamId, teamId),
					eq(schema.teamAccount.id, accountId)
				)
			)
			.returning()
			.get();

		if (!updatedAccount) {
			throw new Error(
				`Could not update team(${teamId}) account(${accountId}).`
			);
		}

		return updatedAccount;
	}

	function remove(accountId: number): SelectTeamAccount {
		const removedAccount = db
			.delete(schema.teamAccount)
			.where(
				and(
					eq(schema.teamAccount.teamId, teamId),
					eq(schema.teamAccount.id, accountId)
				)
			)
			.returning()
			.get();

		if (!removedAccount) {
			throw new Error(
				`Could not remove team(${teamId}) account(${accountId}).`
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
