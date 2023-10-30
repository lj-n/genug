import type {
	SelectUserAccount,
	SelectUserCategory
} from '$lib/server/schema/tables';
import {
	useUserAccount,
	useUserCategory,
	useUserTransaction
} from '$lib/server/user';
import { beforeAll, describe, expect, test } from 'vitest';

const testUserId = 'qh1jpx6731v8w7v';
const userTransactions = useUserTransaction(testUserId);
const userCategories = useUserCategory(testUserId);
const userAccounts = useUserAccount(testUserId);

let testAccount1: SelectUserAccount;
let testAccount2: SelectUserAccount;
let testCategory1: SelectUserCategory;
let testCategory2: SelectUserCategory;

beforeAll(() => {
	testAccount1 = userAccounts.create({ name: 'Test Account1' });
	testAccount2 = userAccounts.create({ name: 'Test Account2' });
	testCategory1 = userCategories.create({ name: 'Test Category1' });
	testCategory2 = userCategories.create({ name: 'Test Category2' });

	return () => {
		userAccounts.remove(testAccount1.id);
		userAccounts.remove(testAccount2.id);
		userCategories.remove(testCategory1.id);
		userCategories.remove(testCategory2.id);
	};
});

describe('user transactions', () => {
	let transactionId: number;

	test('create transactions', () => {
		const flow = -1250;
		const description = 'Testtransaction description';
		const validated = false;

		const transaction = userTransactions.create({
			flow,
			description,
			validated,
			accountId: testAccount1.id,
			categoryId: testCategory1.id
		});

		transactionId = transaction.id;

		expect(transaction.flow).toBe(flow);
		expect(transaction.description).toBe(description);
		expect(transaction.validated).toBe(validated);
		expect(transaction.accountId).toBe(testAccount1.id);
		expect(transaction.categoryId).toBe(testCategory1.id);
	});

	test('get transaction', () => {
		const transaction = userTransactions.get(transactionId);
		const transactions = userTransactions.getAll();

		expect(transaction).toBeDefined();
		expect(transactions).toHaveLength(1);
	});

	test('update transaction', () => {
		const transaction = userTransactions.update(transactionId, {
			flow: 850,
			validated: false,
			accountId: testAccount2.id,
			categoryId: testCategory2.id
		});

		expect(transaction.flow).toBe(850);
		expect(transaction.validated).toBe(false);
		expect(transaction.accountId).toBe(testAccount2.id);
		expect(transaction.categoryId).toBe(testCategory2.id);

		expect(userTransactions.get(transactionId)).toMatchObject(transaction);

		expect(() =>
			userTransactions.update(transactionId, { categoryId: -1 })
		).toThrowError();
		expect(() =>
			userTransactions.update(transactionId, { accountId: -1 })
		).toThrowError();
	});

	test('remove transaction', () => {
		const removedTransaction = userTransactions.remove(transactionId);

		expect(removedTransaction).toBeDefined();
		expect(userTransactions.getAll()).toHaveLength(0);
		expect(() => userTransactions.get(transactionId)).toThrowError(
			`User(${testUserId}) transaction(${transactionId}) not found`
		);
	});
});
