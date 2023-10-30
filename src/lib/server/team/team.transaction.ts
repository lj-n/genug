import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { schema } from '../schema';
import type {
	InsertTeamTransaction,
	SelectTeamTransaction
} from '../schema/tables';

const teamTransactionFindFirst = db.query.teamTransaction
	.findFirst({
		where: (transaction, { and, eq, sql }) => {
			return and(
				eq(transaction.id, sql.placeholder('transactionId')),
				eq(transaction.teamId, sql.placeholder('teamId'))
			);
		},
		with: {
			category: true,
			account: true
		}
	})
	.prepare();

const teamTransactionFindMany = db.query.teamTransaction
	.findMany({
		where: (transaction, { eq, sql }) => {
			return eq(transaction.teamId, sql.placeholder('teamId'));
		},
		with: {
			category: true,
			account: true
		}
	})
	.prepare();

export function useTeamTransaction(teamId: number) {
	function create(
		draft: Omit<InsertTeamTransaction, 'id' | 'teamId' | 'createdAt'>
	): SelectTeamTransaction {
		const createdTransaction = db
			.insert(schema.teamTransaction)
			.values({ teamId, ...draft })
			.returning()
			.get();

		if (!createdTransaction) {
			throw new Error(`Could not create team(${teamId}) transaction.`);
		}

		return createdTransaction;
	}

	function get(transactionId: number) {
		const transaction = teamTransactionFindFirst.get({ transactionId, teamId });

		if (!transaction) {
			throw new Error(
				`Team(${teamId}) transaction(${transactionId}) not found`
			);
		}

		return transaction;
	}

	function getAll() {
		return teamTransactionFindMany.all({ teamId });
	}

	function update(
		transactionId: number,
		updates: Omit<
			InsertTeamTransaction,
			'id' | 'teamId' | 'createdBy' | 'createdAt'
		>
	): SelectTeamTransaction {
		const updatedTransaction = db
			.update(schema.teamTransaction)
			.set(updates)
			.where(
				and(
					eq(schema.teamTransaction.teamId, teamId),
					eq(schema.teamTransaction.id, transactionId)
				)
			)
			.returning()
			.get();

		if (!updatedTransaction) {
			throw new Error(
				`Could not update team(${teamId}) transaction(${transactionId}).`
			);
		}

		return updatedTransaction;
	}

	function remove(transactionId: number): SelectTeamTransaction {
		const removedTransaction = db
			.delete(schema.teamTransaction)
			.where(
				and(
					eq(schema.teamTransaction.id, transactionId),
					eq(schema.teamTransaction.teamId, teamId)
				)
			)
			.returning()
			.get();

		if (!removedTransaction) {
			throw new Error(
				`Could not remove team(${teamId}) transaction(${transactionId}).`
			);
		}

		return removedTransaction;
	}

	return {
		create,
		get,
		getAll,
		update,
		remove
	};
}
