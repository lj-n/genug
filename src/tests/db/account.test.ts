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
	test('create user account', async () => {
		account = await createUserAccount('pjruqhtcfxxbaqu', testAccount);

		expect(account).toBeDefined();
		expect(account.name).toBe(testAccount);
		expect(account.balanceValidated).toBe(0);
		expect(account.balanceUnvalidated).toBe(0);
		expect(account.balanceWorking).toBe(0);
	});

	test('get user accounts', async () => {
		const accounts = await getUserAccounts('pjruqhtcfxxbaqu');
		expect(accounts.length).toBeGreaterThanOrEqual(1);
		expect(await getUserAccount('pjruqhtcfxxbaqu', account.id)).toBeDefined();
	});

	test('delete user account', async () => {
		const accountsBefore = await getUserAccounts('pjruqhtcfxxbaqu');

		await deleteUserAccount('pjruqhtcfxxbaqu', account.id);

		const accountsAfter = await getUserAccounts('pjruqhtcfxxbaqu');

		expect(accountsBefore.length).toBeGreaterThan(accountsAfter.length);
	});
});
