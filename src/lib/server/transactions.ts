import { and, eq, or, sql } from 'drizzle-orm';
import { db } from './db';
import { schema } from './schema';
import { updateUserAccount, getUserAccount } from './accounts';
import type {
	InsertUserTransaction,
	UserAccount,
	UserTransaction
} from './schema/tables';

function removeTransactionFromAccountBalance({
	transaction,
	account
}: {
	transaction: Pick<UserTransaction, 'flow' | 'validated' | 'accountId'>;
	account: UserAccount;
}): UserAccount {
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
	transaction: Pick<UserTransaction, 'flow' | 'validated' | 'accountId'>;
	account: UserAccount;
}): UserAccount {
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
		UserTransaction,
		'flow' | 'validated' | 'accountId'
	>;
	updatedTransaction: Pick<UserTransaction, 'flow' | 'validated' | 'accountId'>;
	account: UserAccount;
}): UserAccount {
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

export function handleTransactionAccountChange(
	transaction: UserTransaction,
	updates: Pick<UserTransaction, 'flow' | 'validated' | 'accountId'>
) {
	const accounts = db
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
		)
		.all();

	const prevAccount = accounts.find(({ id }) => id === transaction.accountId);
	const nextAccount = accounts.find(({ id }) => id === updates.accountId);

	if (!prevAccount || !nextAccount) {
		throw new Error('handleTransactionAccountChange: accounts not found.');
	}

	updateUserAccount(
		prevAccount.id,
		removeTransactionFromAccountBalance({
			account: prevAccount,
			transaction: transaction
		})
	);

	updateUserAccount(
		nextAccount.id,
		addTransactionToAccountBalance({
			account: nextAccount,
			transaction: updates
		})
	);
}

function handleTransactionFlowOrValidationChange(
	transaction: UserTransaction,
	updates: Pick<UserTransaction, 'flow' | 'validated' | 'accountId'>
) {
	const account = db
		.select()
		.from(schema.userAccount)
		.where(
			and(
				eq(schema.userAccount.userId, transaction.userId),
				eq(schema.userAccount.id, transaction.id)
			)
		)
		.get();

	if (!account) {
		throw new Error('account not found.');
	}

	updateUserAccount(
		account.id,
		updateTransactionInAccountBalance({
			account,
			previousTransaction: transaction,
			updatedTransaction: updates
		})
	);
}

export function updateUserTransaction(
	transaction: UserTransaction,
	updates: UserTransaction
): UserTransaction {
	return db.transaction(() => {
		/**
		 * If account, flow or validation changed update account balances accordingly.
		 */
		const accountChanged = transaction.accountId !== updates.accountId;
		const validatedChanged = transaction.validated !== updates.validated;
		const flowChanged = transaction.flow !== updates.flow;

		if (accountChanged) {
			handleTransactionAccountChange(transaction, updates);
		} else if (flowChanged || validatedChanged) {
			handleTransactionFlowOrValidationChange(transaction, updates);
		}

		const updatedTransaction = db
			.update(schema.userTransaction)
			.set(updates)
			.where(eq(schema.userTransaction.id, transaction.id))
			.returning()
			.get();

		if (!updatedTransaction) {
			throw new Error('could not update transaction');
		}

		return updatedTransaction;
	});
}

export function createUserTransaction(
	transaction: InsertUserTransaction
): UserTransaction {
	return db.transaction(() => {
		/**
		 * https://www.sqlite.org/pragma.html#pragma_foreign_keys
		 */
		db.run(sql`pragma foreign_keys = TRUE`);

		const account = getUserAccount(transaction.userId, transaction.accountId);

		updateUserAccount(
			account.id,
			addTransactionToAccountBalance({
				account,
				transaction
			})
		);

		const newTransaction = db
			.insert(schema.userTransaction)
			.values(transaction)
			.returning()
			.get();

		if (!newTransaction) {
			throw new Error('Could not create transaction');
		}

		return newTransaction;
	});
}

export function getUserTransactions(userId: string): UserTransaction[] {
	return db
		.select()
		.from(schema.userTransaction)
		.where(eq(schema.userTransaction.userId, userId))
		.all();
}

export function getUserTransaction(
	userId: string,
	id: number
): UserTransaction | undefined {
	return db
		.select()
		.from(schema.userTransaction)
		.where(
			and(
				eq(schema.userTransaction.userId, userId),
				eq(schema.userTransaction.id, id)
			)
		)
		.get();
}
