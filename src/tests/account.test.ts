import { beforeAll, describe, expect, test } from 'vitest';
import { setupDataBase, teardownDataBase } from './setup';
import {
	createUserAccount,
	deleteUserAccount,
	getUserAccount,
	getUserAccounts
} from '../routes/account/account.utils';
import type { schema } from '$lib/server/schema';

beforeAll(() => {
	const sqlFiles = [
		'database/0000_curved_jack_flag.sql',
		'database/9999_testing_data.sql'
	];

	setupDataBase(...sqlFiles);

	return () => {
		teardownDataBase();
	};
});

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
