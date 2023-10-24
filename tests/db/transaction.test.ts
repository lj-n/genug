import { describe, expect, test } from 'vitest';
import type { UserTransaction } from '$lib/server/schema/tables';
import { User } from '$lib/server/user';

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
const user = new User(testUserId);

let tempTransaction: UserTransaction;

describe('user transactions', () => {
	test('create transaction', () => {
		tempTransaction = user.transactions.create({
			accountId: 1,
			categoryId: 1,
			flow: -200,
			validated: false
		});

		const account = user.accounts.get(1);

		expect(account.balanceValidated).toBe(200);
		expect(account.balanceUnvalidated).toBe(-200);
		expect(account.balanceWorking).toBe(0);
	});

	test('create invalid transaction', () => {
		expect(() =>
			user.transactions.create({
				accountId: 1,
				categoryId: -1, // invalid foreign key
				flow: 500,
				validated: false
			})
		).toThrowError();
	});

	describe('user transaction updates', () => {
		test('update transaction: flow', () => {
			tempTransaction = user.transactions.update(tempTransaction.id, {
				...tempTransaction,
				flow: -400
			});

			const account = user.accounts.get(1);

			expect(account.balanceValidated).toBe(200);
			expect(account.balanceUnvalidated).toBe(-400);
			expect(account.balanceWorking).toBe(-200);
		});

		test('update transaction: validation', () => {
			tempTransaction = user.transactions.update(tempTransaction.id, {
				...tempTransaction,
				validated: !tempTransaction.validated
			});

			const account = user.accounts.get(1);

			expect(account.balanceValidated).toBe(-200);
			expect(account.balanceUnvalidated).toBe(0);
			expect(account.balanceWorking).toBe(-200);
		});

		test('update transaction: flow & validation', () => {
			tempTransaction = user.transactions.update(tempTransaction.id, {
				...tempTransaction,
				flow: 400,
				validated: !tempTransaction.validated
			});

			const account = user.accounts.get(1);

			expect(account.balanceValidated).toBe(200);
			expect(account.balanceUnvalidated).toBe(400);
			expect(account.balanceWorking).toBe(600);
		});

		test('update transaction: account', () => {
			tempTransaction = user.transactions.update(tempTransaction.id, {
				...tempTransaction,
				accountId: 2
			});
			const account = user.accounts.get(1);
			const account2 = user.accounts.get(2);

			expect(account.balanceValidated).toBe(200);
			expect(account.balanceUnvalidated).toBe(0);
			expect(account.balanceWorking).toBe(200);

			expect(account2.balanceValidated).toBe(0);
			expect(account2.balanceUnvalidated).toBe(400);
			expect(account2.balanceWorking).toBe(400);
		});

		test('update transaction: account & flow', () => {
			tempTransaction = user.transactions.update(tempTransaction.id, {
				...tempTransaction,
				flow: -100,
				accountId: 1
			});

			const account = user.accounts.get(1);
			const account2 = user.accounts.get(2);

			expect(account.balanceValidated).toBe(200);
			expect(account.balanceUnvalidated).toBe(-100);
			expect(account.balanceWorking).toBe(100);

			expect(account2.balanceValidated).toBe(0);
			expect(account2.balanceUnvalidated).toBe(0);
			expect(account2.balanceWorking).toBe(0);
		});

		test('update transaction: account & validation', () => {
			tempTransaction = user.transactions.update(tempTransaction.id, {
				...tempTransaction,
				validated: !tempTransaction.validated,
				accountId: 2
			});

			const account = user.accounts.get(1);
			const account2 = user.accounts.get(2);

			expect(account.balanceValidated).toBe(200);
			expect(account.balanceUnvalidated).toBe(0);
			expect(account.balanceWorking).toBe(200);

			expect(account2.balanceValidated).toBe(-100);
			expect(account2.balanceUnvalidated).toBe(0);
			expect(account2.balanceWorking).toBe(-100);
		});

		test('update transaction: account & validation & flow', () => {
			tempTransaction = user.transactions.update(tempTransaction.id, {
				...tempTransaction,
				flow: -800,
				validated: !tempTransaction.validated,
				accountId: 1
			});

			const account = user.accounts.get(1);
			const account2 = user.accounts.get(2);

			expect(account.balanceValidated).toBe(200);
			expect(account.balanceUnvalidated).toBe(-800);
			expect(account.balanceWorking).toBe(-600);

			expect(account2.balanceValidated).toBe(0);
			expect(account2.balanceUnvalidated).toBe(0);
			expect(account2.balanceWorking).toBe(0);
		});

		test('update transaction: category', () => {
			tempTransaction = user.transactions.update(tempTransaction.id, {
				...tempTransaction,
				categoryId: null
			});

			expect(tempTransaction.categoryId).toBeNull();

			const account = user.accounts.get(1);
			const account2 = user.accounts.get(2);

			expect(account.balanceValidated).toBe(200);
			expect(account.balanceUnvalidated).toBe(-800);
			expect(account.balanceWorking).toBe(-600);

			expect(account2.balanceValidated).toBe(0);
			expect(account2.balanceUnvalidated).toBe(0);
			expect(account2.balanceWorking).toBe(0);
		});
	});

	test('delete transaction', () => {
		const transactionsBefore = user.transactions.getAll();

		user.transactions.delete(tempTransaction.id);

		const transactionAfter = user.transactions.getAll();

		expect(transactionsBefore.length).greaterThan(transactionAfter.length);
	});
});
