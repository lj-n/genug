import { describe, expect, test } from 'vitest';
import type { schema } from '$lib/server/schema';
import {
	createUserAccount,
	deleteUserAccount,
	getUserAccount,
	getUserAccounts
} from 'routes/account/account.utils';

const testAccount = 'Test Account';

let account: typeof schema.userAccount.$inferSelect;

describe('user accounts', () => {
	test('create user account', async () => {
		account = await createUserAccount('pjruqhtcfxxbaqu', testAccount);

		expect(account).toBeDefined();
		expect(account.name).toBe(testAccount);
	});

	test('get user accounts', async () => {
		expect(await getUserAccounts('pjruqhtcfxxbaqu')).toHaveLength(1);
		expect(await getUserAccount('pjruqhtcfxxbaqu', account.id)).toBeDefined();
	});

	test('delete user account', async () => {
		await deleteUserAccount('pjruqhtcfxxbaqu', account.id);
		expect(await getUserAccounts('pjruqhtcfxxbaqu')).toHaveLength(0);
	});
});
