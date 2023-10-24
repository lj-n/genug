import { describe, expect, test } from 'vitest';
import { getUserAccount } from '$lib/server/accounts';
import {
	createUserTransaction,
	deleteUserTransaction,
	getUserTransactions,
	updateUserTransaction
} from '$lib/server/transactions';
import type { UserTransaction } from '$lib/server/schema/tables';

/**
 * Present rows in the database:
 *
 *    accounts      = [{ id: 1 }, { id: 2 }]
 *    categories    = [{ id: 1 }, { id: 2 }]
 *    transactions  = [
 *     { id: 1, categoryId: null, accountId: 1, flow: 1000, validated: true },
 *     { id: 2, categoryId: 1   , accountId: 1, flow: -800, validated: true },
 *    ]
 */

const testUserId = 'pjruqhtcfxxbaqu';

let tempTransaction: UserTransaction;

describe('user transactions', () => {
	test('create transaction', () => {
		tempTransaction = createUserTransaction({
			userId: testUserId,
			accountId: 1,
			categoryId: 1,
			flow: -200,
			validated: false
		});

		const account = getUserAccount(testUserId, 1);

		expect(account.balanceValidated).toBe(200);
		expect(account.balanceUnvalidated).toBe(-200);
		expect(account.balanceWorking).toBe(0);
	});

	test('create invalid transaction', () => {
		expect(() =>
			createUserTransaction({
				userId: testUserId,
				accountId: 1,
				categoryId: -1, // invalid foreign key
				flow: 500,
				validated: false
			})
		).toThrowError();
	});

	describe('user transaction updates', () => {
		test('update transaction: flow', () => {
			tempTransaction = updateUserTransaction(tempTransaction, {
				...tempTransaction,
				flow: -400
			});

			const account = getUserAccount(testUserId, 1);

			expect(account.balanceValidated).toBe(200);
			expect(account.balanceUnvalidated).toBe(-400);
			expect(account.balanceWorking).toBe(-200);
		});

		test('update transaction: validation', () => {
			tempTransaction = updateUserTransaction(tempTransaction, {
				...tempTransaction,
				validated: !tempTransaction.validated
			});

			const account = getUserAccount(testUserId, 1);

			expect(account.balanceValidated).toBe(-200);
			expect(account.balanceUnvalidated).toBe(0);
			expect(account.balanceWorking).toBe(-200);
		});

		test('update transaction: flow & validation', () => {
			tempTransaction = updateUserTransaction(tempTransaction, {
				...tempTransaction,
        flow: 400,
				validated: !tempTransaction.validated
			});

			const account = getUserAccount(testUserId, 1);

			expect(account.balanceValidated).toBe(200);
			expect(account.balanceUnvalidated).toBe(400);
			expect(account.balanceWorking).toBe(600);
		});

		test('update transaction: account', () => {
			tempTransaction = updateUserTransaction(tempTransaction, {
				...tempTransaction,
        accountId: 2
			});

			const account = getUserAccount(testUserId, 1);
			const account2 = getUserAccount(testUserId, 2);

			expect(account.balanceValidated).toBe(200);
			expect(account.balanceUnvalidated).toBe(0);
			expect(account.balanceWorking).toBe(200);

			expect(account2.balanceValidated).toBe(0);
			expect(account2.balanceUnvalidated).toBe(400);
			expect(account2.balanceWorking).toBe(400);
		});

		test('update transaction: account & flow', () => {
			tempTransaction = updateUserTransaction(tempTransaction, {
				...tempTransaction,
        flow: -100,
        accountId: 1
			});

			const account = getUserAccount(testUserId, 1);
			const account2 = getUserAccount(testUserId, 2);

			expect(account.balanceValidated).toBe(200);
			expect(account.balanceUnvalidated).toBe(-100);
			expect(account.balanceWorking).toBe(100);

			expect(account2.balanceValidated).toBe(0);
			expect(account2.balanceUnvalidated).toBe(0);
			expect(account2.balanceWorking).toBe(0);
		});

		test('update transaction: account & validation', () => {
			tempTransaction = updateUserTransaction(tempTransaction, {
				...tempTransaction,
        validated: !tempTransaction.validated,
        accountId: 2
			});

			const account = getUserAccount(testUserId, 1);
			const account2 = getUserAccount(testUserId, 2);

			expect(account.balanceValidated).toBe(200);
			expect(account.balanceUnvalidated).toBe(0);
			expect(account.balanceWorking).toBe(200);

			expect(account2.balanceValidated).toBe(-100);
			expect(account2.balanceUnvalidated).toBe(0);
			expect(account2.balanceWorking).toBe(-100);
		});

		test('update transaction: account & validation & flow', () => {
			tempTransaction = updateUserTransaction(tempTransaction, {
				...tempTransaction,
        flow: -800,
        validated: !tempTransaction.validated,
        accountId: 1
			});

			const account = getUserAccount(testUserId, 1);
			const account2 = getUserAccount(testUserId, 2);

			expect(account.balanceValidated).toBe(200);
			expect(account.balanceUnvalidated).toBe(-800);
			expect(account.balanceWorking).toBe(-600);

			expect(account2.balanceValidated).toBe(0);
			expect(account2.balanceUnvalidated).toBe(0);
			expect(account2.balanceWorking).toBe(0);
		});

    test('update transaction: category', () => {
      tempTransaction = updateUserTransaction(tempTransaction, {
				...tempTransaction,
        categoryId: null
			});

      expect(tempTransaction.categoryId).toBeNull()

      const account = getUserAccount(testUserId, 1);
			const account2 = getUserAccount(testUserId, 2);

			expect(account.balanceValidated).toBe(200);
			expect(account.balanceUnvalidated).toBe(-800);
			expect(account.balanceWorking).toBe(-600);

			expect(account2.balanceValidated).toBe(0);
			expect(account2.balanceUnvalidated).toBe(0);
			expect(account2.balanceWorking).toBe(0);
    })

	});

	test('delete transaction', () => {
		const transactionsBefore = getUserTransactions(testUserId);

		deleteUserTransaction(testUserId, tempTransaction.id);

		const transactionAfter = getUserTransactions(testUserId);

		expect(transactionsBefore.length).greaterThan(transactionAfter.length);
	});
});
