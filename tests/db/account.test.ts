import { describe, expect, test } from 'vitest';
import type { schema } from '$lib/server/schema';
import {
	createUserAccount,
	deleteUserAccount,
	getUserAccount,
	getUserAccounts
} from '$lib/server/accounts';

const testAccount = 'Awesome Account';

let account: typeof schema.userAccount.$inferSelect;

describe('user accounts', () => {
	test('create user account', () => {
		account = createUserAccount('pjruqhtcfxxbaqu', testAccount);

		expect(account).toBeDefined();
		expect(account.name).toBe(testAccount);
		expect(account.balanceValidated).toBe(0);
		expect(account.balanceUnvalidated).toBe(0);
		expect(account.balanceWorking).toBe(0);
	});

	test('get user accounts', () => {
		const accounts = getUserAccounts('pjruqhtcfxxbaqu');
		expect(accounts.length).toBeGreaterThanOrEqual(1);
		expect(getUserAccount('pjruqhtcfxxbaqu', account.id)).toBeDefined();
	});

	test('delete user account', () => {
		const accountsBefore = getUserAccounts('pjruqhtcfxxbaqu');

		deleteUserAccount('pjruqhtcfxxbaqu', account.id);

		const accountsAfter = getUserAccounts('pjruqhtcfxxbaqu');

		expect(accountsBefore.length).toBeGreaterThan(accountsAfter.length);
	});
});
