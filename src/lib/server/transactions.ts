import { and, eq, or, sql } from 'drizzle-orm';
import { db } from './db';
import { schema } from './schema';
import {
	type SelectUserAccount,
	updateUserAccount,
	getUserAccount
} from './accounts';

export type SelectUserTransaction = typeof schema.userTransaction.$inferSelect;
export type InsertUserTransaction = typeof schema.userTransaction.$inferInsert;

function removeTransactionFromAccountBalance({
	transaction,
	account
}: {
	transaction: Pick<SelectUserTransaction, 'flow' | 'validated' | 'accountId'>;
	account: SelectUserAccount;
}): SelectUserAccount {
	if (transaction.validated) {
		account.balanceValidated -= transaction.flow;
	} else {
		account.balanceUnvalidated -= transaction.flow;
	}
	account.balanceWorking -= transaction.flow;

	return account;
}

function addTransactionToAccountBalance({
	transaction,
	account
}: {
	transaction: Pick<SelectUserTransaction, 'flow' | 'validated' | 'accountId'>;
	account: SelectUserAccount;
}): SelectUserAccount {
	if (transaction.validated) {
		account.balanceValidated += transaction.flow;
	} else {
		account.balanceUnvalidated += transaction.flow;
	}
	account.balanceWorking += transaction.flow;

	return account;
}

function updateTransactionInAccountBalance({
	previousTransaction,
	updatedTransaction,
	account
}: {
	previousTransaction: Pick<
		SelectUserTransaction,
		'flow' | 'validated' | 'accountId'
	>;
	updatedTransaction: Pick<
		SelectUserTransaction,
		'flow' | 'validated' | 'accountId'
	>;
	account: SelectUserAccount;
}): SelectUserAccount {
	account = removeTransactionFromAccountBalance({
		transaction: previousTransaction,
		account
	});
	account = addTransactionToAccountBalance({
		transaction: updatedTransaction,
		account
	});

	return account;
}

export async function handleTransactionAccountChange(
	transaction: SelectUserTransaction,
	updates: Pick<SelectUserTransaction, 'flow' | 'validated' | 'accountId'>
) {
	const accounts = await db
		.select()
		.from(schema.userAccount)
		.where(
			and(
				or(
					eq(schema.userAccount.id, transaction.accountId),
					eq(schema.userAccount.id, updates.accountId)
				),
				eq(schema.userAccount.userId, transaction.userId)
			)
		);

	const prevAccount = accounts.find(({ id }) => id === transaction.accountId);
	const nextAccount = accounts.find(({ id }) => id === updates.accountId);

	if (!prevAccount || !nextAccount) {
		throw new Error('handleTransactionAccountChange: accounts not found.');
	}

	await updateUserAccount(
		prevAccount.id,
		removeTransactionFromAccountBalance({
			account: prevAccount,
			transaction: transaction
		})
	);

	await updateUserAccount(
		nextAccount.id,
		addTransactionToAccountBalance({
			account: nextAccount,
			transaction: updates
		})
	);
}

async function handleTransactionFlowOrValidationChange(
	transaction: SelectUserTransaction,
	updates: Pick<SelectUserTransaction, 'flow' | 'validated' | 'accountId'>
) {
	const account = await db.query.userAccount.findFirst({
		where: (userAccount, { eq, and }) => {
			return and(
				eq(userAccount.userId, transaction.userId),
				eq(userAccount.id, transaction.id)
			);
		}
	});

	if (!account) {
		throw new Error('account not found.');
	}

	await updateUserAccount(
		account.id,
		updateTransactionInAccountBalance({
			account,
			previousTransaction: transaction,
			updatedTransaction: updates
		})
	);
}

export async function updateUserTransaction(
	transaction: SelectUserTransaction,
	updates: SelectUserTransaction
): Promise<SelectUserTransaction> {
	return db.transaction(async () => {
		/**
		 * If account, flow or validation changed update account balances accordingly.
		 */
		const accountChanged = transaction.accountId !== updates.accountId;
		const validatedChanged = transaction.validated !== updates.validated;
		const flowChanged = transaction.flow !== updates.flow;

		if (accountChanged) {
			await handleTransactionAccountChange(transaction, updates);
		} else if (flowChanged || validatedChanged) {
			await handleTransactionFlowOrValidationChange(transaction, updates);
		}

		const [updatedTransaction] = await db
			.update(schema.userTransaction)
			.set(updates)
			.where(eq(schema.userTransaction.id, transaction.id))
			.returning();

		if (!updatedTransaction) {
			throw new Error('could not update transaction');
		}

		return updatedTransaction;
	});
}

export async function createUserTransaction(
	transaction: InsertUserTransaction
): Promise<SelectUserTransaction> {
	return db.transaction(async () => {
		/**
		 * https://www.sqlite.org/pragma.html#pragma_foreign_keys
		 */
		await db.run(sql`pragma foreign_keys = TRUE`);

		const account = await getUserAccount(
			transaction.userId,
			transaction.accountId
		);

		await updateUserAccount(
			account.id,
			addTransactionToAccountBalance({
				account,
				transaction
			})
		);

		const [newTransaction] = await db
			.insert(schema.userTransaction)
			.values(transaction)
			.returning();

		if (!newTransaction) {
			throw new Error('Could not create transaction');
		}

		return newTransaction;
	});
}

export async function getUserTransactions(userId: string) {
	return db.query.userTransaction.findMany({
		where: (userTransaction, { eq }) => {
			return eq(userTransaction.userId, userId);
		}
	});
}

export async function getUserTransaction(userId: string, id: number) {
	return db.query.userTransaction.findFirst({
		where: (userTransaction, { eq, and }) => {
			return and(
				eq(userTransaction.userId, userId),
				eq(userTransaction.id, id)
			);
		}
	});
}
