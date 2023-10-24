import { describe, expect, test } from 'vitest';
import {
	createUserAccount,
	deleteUserAccount,
	getUserAccounts,
	getUserAccount,
	updateUserAccount
} from '$lib/server/accounts';
import type { UserAccount } from '$lib/server/schema/tables';

const testUserId = 'pjruqhtcfxxbaqu';
const newAccountName = 'Awesome Account';

describe('user accounts', () => {
	let account: UserAccount;

	test('create user account', () => {
		account = createUserAccount(testUserId, newAccountName);

		expect(account.name).toBe(newAccountName);
		expect(account.balanceValidated).toBe(0);
		expect(account.balanceUnvalidated).toBe(0);
		expect(account.balanceWorking).toBe(0);
	});

	test('create invalid user account', () => {
		expect(() => createUserAccount('123', 'Name')).toThrowError();
	});

	test('get user account', () => {
		account = getUserAccount(testUserId, account.id);
		expect(account.name).toBe(newAccountName);
		expect(() => getUserAccount(testUserId, -1)).toThrowError();
	});

	test('update user account', () => {
		account = updateUserAccount(account.id, {
			...account,
			description: 'New Description'
		});

		expect(account.description).toBe('New Description');
	});

	test('delete user account', () => {
		const accountsBefore = getUserAccounts(testUserId);

		deleteUserAccount(testUserId, account.id);

		const accountsAfter = getUserAccounts(testUserId);

		expect(accountsBefore.length).toBeGreaterThan(accountsAfter.length);
	});
});
