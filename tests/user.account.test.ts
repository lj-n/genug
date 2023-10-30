import { beforeAll, describe, expect, test } from 'vitest';
import { useUserAccount, useUserTransaction } from '$lib/server/user';

const testUserId = 'qh1jpx6731v8w7v';
const userAccounts = useUserAccount(testUserId);
const userTransactions = useUserTransaction(testUserId);

const deleteAllTransaction = () => {
	const transactions = userTransactions.getAll();
	for (const { id } of transactions) {
		userTransactions.remove(id);
	}
};

beforeAll(() => {
	deleteAllTransaction();
	return () => {
		deleteAllTransaction();
	};
});

describe('user accounts', () => {
	let accountId: number;

	test('create account', () => {
		const name = 'Testaccount';
		const description = 'Testaccount description';

		const account = userAccounts.create({ name, description });

		accountId = account.id;

		expect(account.name).toBe(name);
		expect(account.description).toBe(description);
		expect(account.userId).toBe(testUserId);
	});

	test('get account', () => {
		const account = userAccounts.get(accountId);
		const accountWithTransactions = userAccounts.getWithTransactions(accountId);
		const accounts = userAccounts.getAll();
		const accountsWithTransactions = userAccounts.getAllWithTransactions();

		expect(account).toBeDefined();
		expect(accountWithTransactions).toHaveProperty('transactions', []);
		expect(accounts).toHaveLength(1);
		expect(accountsWithTransactions[0]).toHaveProperty('transactions', []);
	});

	test('update account', () => {
		const account = userAccounts.update(accountId, { name: 'New Name' });
		expect(account.name).toBe('New Name');
		expect(userAccounts.get(accountId).name).toBe('New Name');
	});

	test('aggregate account balances', () => {
		userTransactions.create({
			accountId,
			flow: 400,
			validated: true
		});
		userTransactions.create({
			accountId,
			flow: -800,
			validated: true
		});
		userTransactions.create({
			accountId,
			flow: -200,
			validated: false
		});
		userTransactions.create({
			accountId,
			flow: 1000,
			validated: false
		});

		const balance = userAccounts.getBalance(accountId);
		const balances = userAccounts.getBalances();

		expect(balance.validated).toBe(-400);
		expect(balance.pending).toBe(800);
		expect(balances).toMatchObject([
			{
				accountId,
				validated: -400,
				pending: 800
			}
		]);
	});

	test('remove account', () => {
		const removedAccount = userAccounts.remove(accountId);
		expect(removedAccount).toBeDefined();
		expect(() => userAccounts.get(accountId)).toThrowError(
			`User(${testUserId}) account(${accountId}) not found`
		);
	});
});
