import { describe, expect, test } from 'vitest';
import type { UserAccount } from '$lib/server/schema/tables';
import { User } from '$lib/server/user';

const testUserId = 'qh1jpx6731v8w7v';
const newAccountName = 'Awesome Account';

const user = new User(testUserId);

describe('user accounts', () => {
	let account: UserAccount;

	test('create user account', () => {
		// account = createUserAccount(testUserId, newAccountName);
		account = user.accounts.create({ name: newAccountName });

		expect(account.name).toBe(newAccountName);
		expect(account.balanceValidated).toBe(0);
		expect(account.balanceUnvalidated).toBe(0);
		expect(account.balanceWorking).toBe(0);
	});

	test('get user account', () => {
		account = user.accounts.get(account.id);
		expect(account.name).toBe(newAccountName);
		expect(() => user.accounts.get(-1)).toThrowError();
	});

	test('update user account', () => {
		account = user.accounts.update(account.id, {
			...account,
			description: 'New Description'
		});

		expect(account.description).toBe('New Description');
	});

	test('delete user account', () => {
		const accountsBefore = user.accounts.getAll();

		user.accounts.delete(account.id);

		const accountsAfter = user.accounts.getAll();

		expect(accountsBefore.length).toBeGreaterThan(accountsAfter.length);
	});
});
