import { beforeAll, describe, expect, test } from 'vitest';
import { useTestDatabase } from '$testing/create.test.db';
import type { Database } from '../db';
import {
	createUserTransaction,
	deleteUserTransaction,
	getUserTransaction,
	updateUserTransaction
} from './transaction.user';
import {
	createUserAccount,
	getUserAccountBalance
} from '../account/account.user';
import { createTransferTransactions } from './transaction.utils';

let db: Database;
let userId: string;

beforeAll(async () => {
	const { database, client, testUser } = useTestDatabase();
	db = database;
	userId = testUser.id;

	return async () => {
		client.close();
	};
});

describe('user transactions', () => {
	let transactionId: number;

	test('create transaction', () => {
		const account = createUserAccount(db, {
			userId,
			name: 'Temporary Account'
		});

		const transaction = createUserTransaction(db, {
			userId,
			accountId: account.id,
			flow: 500,
			validated: false
		});

		transactionId = transaction.id;

		expect(transaction.flow).toBe(500);
		expect(transaction.validated).toBe(false);
		expect(transaction.accountId).toBe(account.id);
	});

	test('get transaction(s)', () => {
		const transaction = getUserTransaction(db, userId, transactionId);

		expect(transaction?.id).toBe(transactionId);
		expect(getUserTransaction(db, userId, -1)).toBeUndefined();
	});

	test('update transaction', () => {
		const transaction = updateUserTransaction(db, userId, transactionId, {
			flow: 200
		});

		expect(transaction.flow).toBe(200);
		expect(getUserTransaction(db, userId, transactionId)?.flow).toBe(200);
		expect(() =>
			updateUserTransaction(db, userId, -1, { flow: 100 })
		).toThrowError(`Transaction with id (-1) not found.`);
	});

	test('delete transaction', () => {
		const transaction = deleteUserTransaction(db, userId, transactionId);

		expect(transaction?.id).toBe(transactionId);
		expect(getUserTransaction(db, userId, transactionId)).toBeUndefined();
	});
});

describe('transfer transactions', () => {
	test('transfer transaction between user accounts', () => {
		const account1 = createUserAccount(db, {
			userId,
			name: 'Temporary Account 1'
		});

		const account2 = createUserAccount(db, {
			userId,
			name: 'Temporary Account 2'
		});

		const { outgoingTransaction, incomingTransaction } =
			createTransferTransactions(
				db,
				(database) => {
					return createUserTransaction(database, {
						userId,
						accountId: account1.id,
						flow: -500,
						validated: false
					});
				},
				(database) => {
					return createUserTransaction(database, {
						userId,
						accountId: account2.id,
						flow: 500,
						validated: false
					});
				}
			);

		expect(outgoingTransaction.flow).toBe(-500);
		expect(incomingTransaction.flow).toBe(500);
		expect(outgoingTransaction.accountId).toBe(account1.id);
		expect(incomingTransaction.accountId).toBe(account2.id);

		expect(getUserAccountBalance(db, userId, account1.id)).toStrictEqual({
			validated: 0,
			pending: -500,
			working: -500
		});
		expect(getUserAccountBalance(db, userId, account2.id)).toStrictEqual({
			validated: 0,
			pending: 500,
			working: 500
		});
	});

	// test('transfer transaction to team account', () => {
	//
	// })
});
