import { beforeAll, describe, expect, test } from 'vitest';

import type { Database } from '../db';
import {
	createUserAccount,
	deleteUserAccount,
	getUserAccount,
	getUserAccountBalance,
	getUserAccounts,
	updateUserAccount
} from './account.user';
import { useTestDatabase } from '$testing/create.test.db';
import { createUserTransaction, deleteUserTransaction } from '../transaction/transaction.user';

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

describe('user accounts', () => {
	let accountId: number;

	test('create account', () => {
		const accountName = 'Test Account';
		const accountDescription = 'Text Account Description';
		const account = createUserAccount(db, {
			userId,
			name: accountName,
			description: accountDescription
		});

		accountId = account.id;

		expect(account.name).toBe(accountName);
		expect(account.userId).toBe(userId);
		expect(account.description).toBe(accountDescription);
	});

	test('get account(s)', () => {
		const account = getUserAccount(db, userId, accountId);
		const accounts = getUserAccounts(db, userId);

		expect(account?.id).toBe(accountId);
		expect(accounts).toHaveLength(1);
		expect(accounts).toContainEqual(account);

		expect(getUserAccount(db, userId, -1)).toBeUndefined();
	});

	test('update account', () => {
		const account = updateUserAccount(db, userId, accountId, {
			name: 'New Name'
		});

		expect(account.name).toBe('New Name');
		expect(getUserAccount(db, userId, accountId)?.name).toBe('New Name');

		expect(() =>
			updateUserAccount(db, userId, -1, { name: 'invalid id' })
		).toThrowError(`Account with id (-1) not found.`);
	});

	test('delete account', () => {
		const account = deleteUserAccount(db, userId, accountId);

		expect(account?.id).toBe(accountId);
		expect(getUserAccount(db, userId, accountId)).toBeUndefined();
		expect(getUserAccounts(db, userId)).toHaveLength(0);
	});
});

describe('user account balance', () => {
	let accountId: number;
	test('new account balance should be zero', () => {
		const accountName = 'Test Account';
		const accountDescription = 'Text Account Description';
		const account = createUserAccount(db, {
			userId,
			name: accountName,
			description: accountDescription
		});

		accountId = account.id;

		const balance = getUserAccountBalance(db, userId, accountId);

		expect(balance).toStrictEqual({ validated: 0, pending: 0, working: 0 });
	});

	test('account balance after adding transactions', () => {
		createUserTransaction(db, {
			userId,
			accountId,
			flow: 500,
			validated: true
		});
		createUserTransaction(db, {
			userId,
			accountId,
			flow: -300,
			validated: false
		});
		const transaction = createUserTransaction(db, {
			userId,
			accountId,
			flow: -200,
			validated: false
		});

		let balance = getUserAccountBalance(db, userId, accountId);

		expect(balance).toStrictEqual({
			validated: 500,
			pending: -500,
			working: 0
		});

    deleteUserTransaction(db, userId, transaction.id);

    balance = getUserAccountBalance(db, userId, accountId);

		expect(balance).toStrictEqual({
      validated: 500,
      pending: -300,
      working: 200
    });
	});
});
