import { beforeAll, describe, expect, test } from 'vitest';
import type {
	SelectUserAccount,
	SelectUserCategory,
	SelectUserTransaction
} from '$lib/server/schema/tables';
import { User } from '$lib/server';

const testUserId = 'qh1jpx6731v8w7v';
const user = new User(testUserId);

let testAccount1: SelectUserAccount;
let testAccount2: SelectUserAccount;
let testCategory1: SelectUserCategory;
let testCategory2: SelectUserCategory;

beforeAll(() => {
	testAccount1 = user.account.create({ name: 'Test Account' });
	testAccount2 = user.account.create({ name: 'Test Account' });
	testCategory1 = user.category.create({ name: 'Test Category' });
	testCategory2 = user.category.create({ name: 'Test Category' });

	return () => {
		user.account.delete(testAccount1.id);
		user.account.delete(testAccount2.id);
		user.category.delete(testCategory1.id);
		user.category.delete(testCategory2.id);
	};
});

describe('user transactions', () => {
	let tempTransaction: SelectUserTransaction;

	test('create transaction', () => {
		tempTransaction = user.transaction.create({
			accountId: testAccount1.id,
			categoryId: testCategory1.id,
			flow: -200,
			validated: false
		});

		const account = user.account.get(testAccount1.id);

		expect(account.balanceValidated).toBe(0);
		expect(account.balanceUnvalidated).toBe(-200);
		expect(account.balanceWorking).toBe(-200);
	});

	test('create invalid transaction', () => {
		expect(() =>
			user.transaction.create({
				accountId: testAccount1.id,
				categoryId: -1, // invalid foreign key
				flow: 500,
				validated: false
			})
		).toThrowError();
	});

	describe('user transaction updates', () => {
		test('update transaction: flow', () => {
			tempTransaction = user.transaction.update(tempTransaction.id, {
				...tempTransaction,
				flow: -400
			});

			const account = user.account.get(testAccount1.id);

			expect(account.balanceValidated).toBe(0);
			expect(account.balanceUnvalidated).toBe(-400);
			expect(account.balanceWorking).toBe(-400);
		});

		test('update transaction: validation', () => {
			tempTransaction = user.transaction.update(tempTransaction.id, {
				...tempTransaction,
				validated: !tempTransaction.validated
			});

			const account = user.account.get(testAccount1.id);

			expect(account.balanceValidated).toBe(-400);
			expect(account.balanceUnvalidated).toBe(0);
			expect(account.balanceWorking).toBe(-400);
		});

		test('update transaction: flow & validation', () => {
			tempTransaction = user.transaction.update(tempTransaction.id, {
				...tempTransaction,
				flow: 400,
				validated: !tempTransaction.validated
			});

			const account = user.account.get(testAccount1.id);

			expect(account.balanceValidated).toBe(0);
			expect(account.balanceUnvalidated).toBe(400);
			expect(account.balanceWorking).toBe(400);
		});

		test('update transaction: account', () => {
			tempTransaction = user.transaction.update(tempTransaction.id, {
				...tempTransaction,
				accountId: testAccount2.id
			});
			const account = user.account.get(testAccount1.id);
			const account2 = user.account.get(testAccount2.id);

			expect(account.balanceValidated).toBe(0);
			expect(account.balanceUnvalidated).toBe(0);
			expect(account.balanceWorking).toBe(0);

			expect(account2.balanceValidated).toBe(0);
			expect(account2.balanceUnvalidated).toBe(400);
			expect(account2.balanceWorking).toBe(400);
		});

		test('update transaction: account & flow', () => {
			tempTransaction = user.transaction.update(tempTransaction.id, {
				...tempTransaction,
				flow: -100,
				accountId: testAccount1.id
			});

			const account = user.account.get(testAccount1.id);
			const account2 = user.account.get(testAccount2.id);

			expect(account.balanceValidated).toBe(0);
			expect(account.balanceUnvalidated).toBe(-100);
			expect(account.balanceWorking).toBe(-100);

			expect(account2.balanceValidated).toBe(0);
			expect(account2.balanceUnvalidated).toBe(0);
			expect(account2.balanceWorking).toBe(0);
		});

		test('update transaction: account & validation', () => {
			tempTransaction = user.transaction.update(tempTransaction.id, {
				...tempTransaction,
				validated: !tempTransaction.validated,
				accountId: testAccount2.id
			});

			const account = user.account.get(testAccount1.id);
			const account2 = user.account.get(testAccount2.id);

			expect(account.balanceValidated).toBe(0);
			expect(account.balanceUnvalidated).toBe(0);
			expect(account.balanceWorking).toBe(0);

			expect(account2.balanceValidated).toBe(-100);
			expect(account2.balanceUnvalidated).toBe(0);
			expect(account2.balanceWorking).toBe(-100);
		});

		test('update transaction: account & validation & flow', () => {
			tempTransaction = user.transaction.update(tempTransaction.id, {
				...tempTransaction,
				flow: -800,
				validated: !tempTransaction.validated,
				accountId: testAccount1.id
			});

			const account = user.account.get(testAccount1.id);
			const account2 = user.account.get(testAccount2.id);

			expect(account.balanceValidated).toBe(0);
			expect(account.balanceUnvalidated).toBe(-800);
			expect(account.balanceWorking).toBe(-800);

			expect(account2.balanceValidated).toBe(0);
			expect(account2.balanceUnvalidated).toBe(0);
			expect(account2.balanceWorking).toBe(0);
		});

		test('update transaction: category', () => {
			tempTransaction = user.transaction.update(tempTransaction.id, {
				...tempTransaction,
				categoryId: null
			});

			expect(tempTransaction.categoryId).toBeNull();

			const account = user.account.get(testAccount1.id);
			const account2 = user.account.get(testAccount2.id);

			expect(account.balanceValidated).toBe(0);
			expect(account.balanceUnvalidated).toBe(-800);
			expect(account.balanceWorking).toBe(-800);

			expect(account2.balanceValidated).toBe(0);
			expect(account2.balanceUnvalidated).toBe(0);
			expect(account2.balanceWorking).toBe(0);
		});
	});

	test('delete transaction', () => {
		const transactionsBefore = user.transaction.getAll();

		user.transaction.delete(tempTransaction.id);

		const transactionAfter = user.transaction.getAll();

		expect(transactionsBefore.length).greaterThan(transactionAfter.length);
	});
});
