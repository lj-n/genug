import { createUserAccount, getUserAccount } from '$lib/server/accounts';
import type { schema } from '$lib/server/schema';

import {
	createUserTransaction,
	updateUserTransaction
} from '$lib/server/transactions';

import { describe, expect, test } from 'vitest';

const transactions: (typeof schema.userTransaction.$inferSelect)[] = [];

const testUserid = 'pjruqhtcfxxbaqu';
const testAccountId = 1;

let transaction1: typeof schema.userTransaction.$inferSelect;
let transaction2: typeof schema.userTransaction.$inferSelect;

describe('user transactions', () => {
	test('create user transactions', async () => {
		transaction1 = await createUserTransaction({
			userId: 'pjruqhtcfxxbaqu',
			categoryId: 1,
			accountId: testAccountId,
			flow: -600,
			validated: false
		});
		transaction2 = await createUserTransaction({
			userId: 'pjruqhtcfxxbaqu',
			categoryId: 1,
			accountId: testAccountId,
			flow: 800,
			validated: true
		});

		transactions.push(transaction1, transaction2);
		expect(transactions).toHaveLength(2);

		const account = await getUserAccount(testUserid, 1);

		expect(account).toBeDefined();
		expect(account?.balanceUnvalidated).toBe(-600);
		expect(account?.balanceValidated).toBe(800);
		expect(account?.balanceWorking).toBe(200);
	});

	test('create invalid user transaction', async () => {
		const createInvalidTransaction = async () => {
			await createUserTransaction({
				userId: 'pjruqhtcfxxbaqu',
				categoryId: 10, // foreign key does not exists
				accountId: testAccountId,
				flow: 800,
				validated: true
			});
		};
		await expect(() => createInvalidTransaction()).rejects.toThrowError();
	});

	describe('transaction updates', () => {
		test('change transaction flow', async () => {
			transaction1 = await updateUserTransaction(transaction1, {
				...transaction1,
				flow: -500
			});

			expect(transaction1).toBeDefined();

			const account = await getUserAccount(testUserid, testAccountId);

			expect(account?.balanceValidated).toBe(800);
			expect(account?.balanceUnvalidated).toBe(-500);
			expect(account?.balanceWorking).toBe(300);
		});

		test('change transaction validation', async () => {
			transaction1 = await updateUserTransaction(transaction1, {
				...transaction1,
				validated: !transaction1.validated
			});

			expect(transaction1).toBeDefined();

			const account = await getUserAccount(testUserid, testAccountId);

			expect(account?.balanceValidated).toBe(300);
			expect(account?.balanceUnvalidated).toBe(0);
			expect(account?.balanceWorking).toBe(300);
		});

		test('change transaction flow & validation', async () => {
			transaction1 = await updateUserTransaction(transaction1, {
				...transaction1,
				validated: !transaction1.validated,
				flow: -200
			});

			expect(transaction1).toBeDefined();

			const account = await getUserAccount(testUserid, testAccountId);

			expect(account?.balanceValidated).toBe(800);
			expect(account?.balanceUnvalidated).toBe(-200);
			expect(account?.balanceWorking).toBe(600);
		});

		let newAccount: typeof schema.userAccount.$inferSelect;
		test('change transaction account', async () => {
			newAccount = await createUserAccount(
				testUserid,
				'Transaction testing account'
			);

			expect(newAccount).toBeDefined();

			transaction1 = await updateUserTransaction(transaction1, {
				...transaction1,
				accountId: newAccount.id
			});

			expect(transaction1).toBeDefined();

			const account = await getUserAccount(testUserid, testAccountId);
			const secondAccount = await getUserAccount(testUserid, newAccount.id);

			expect(account?.balanceValidated).toBe(800);
			expect(account?.balanceUnvalidated).toBe(0);
			expect(account?.balanceWorking).toBe(800);

			expect(secondAccount?.balanceValidated).toBe(0);
			expect(secondAccount?.balanceUnvalidated).toBe(-200);
			expect(secondAccount?.balanceWorking).toBe(-200);
		});

		test('change transaction account & flow', async () => {
			transaction1 = await updateUserTransaction(transaction1, {
				...transaction1,
				accountId: testAccountId,
				flow: 1000
			});

			expect(transaction1).toBeDefined();

			const account = await getUserAccount(testUserid, testAccountId);
			const secondAccount = await getUserAccount(testUserid, newAccount.id);

			expect(account?.balanceValidated).toBe(800);
			expect(account?.balanceUnvalidated).toBe(1000);
			expect(account?.balanceWorking).toBe(1800);

			expect(secondAccount?.balanceValidated).toBe(0);
			expect(secondAccount?.balanceUnvalidated).toBe(0);
			expect(secondAccount?.balanceWorking).toBe(0);
		});

		test('change transaction account & validation', async () => {
			transaction1 = await updateUserTransaction(transaction1, {
				...transaction1,
				accountId: newAccount.id,
				flow: transaction1.flow,
				validated: !transaction1.validated
			});

			expect(transaction1).toBeDefined();

			const account = await getUserAccount(testUserid, testAccountId);
			const secondAccount = await getUserAccount(testUserid, newAccount.id);

			expect(account?.balanceValidated).toBe(800);
			expect(account?.balanceUnvalidated).toBe(0);
			expect(account?.balanceWorking).toBe(800);

			expect(secondAccount?.balanceValidated).toBe(1000);
			expect(secondAccount?.balanceUnvalidated).toBe(0);
			expect(secondAccount?.balanceWorking).toBe(1000);
		});

		test('change transaction account & validation & flow', async () => {
			transaction1 = await updateUserTransaction(transaction1, {
				...transaction1,
				accountId: testAccountId,
				flow: -1200,
				validated: !transaction1.validated
			});

			expect(transaction1).toBeDefined();

			const account = await getUserAccount(testUserid, testAccountId);
			const secondAccount = await getUserAccount(testUserid, newAccount.id);

			expect(account?.balanceValidated).toBe(800);
			expect(account?.balanceUnvalidated).toBe(-1200);
			expect(account?.balanceWorking).toBe(-400);

			expect(secondAccount?.balanceValidated).toBe(0);
			expect(secondAccount?.balanceUnvalidated).toBe(0);
			expect(secondAccount?.balanceWorking).toBe(0);
		});
	});
});
