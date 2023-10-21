import type { schema } from '$lib/server/schema';
import {
	createUserTransaction,
	getUserTransaction,
	getUserTransactions
} from 'routes/transaction/transaction.utils';
import { describe, expect, test } from 'vitest';

describe('transactions', () => {
	test('get transactions', async () => {
		const transactions = await getUserTransactions('pjruqhtcfxxbaqu');
		expect(transactions).toHaveLength(2);
	});

	let transaction: (typeof schema.userTransaction.$inferSelect)[];
	test('create transaction', async () => {
		transaction = await createUserTransaction({
			userId: 'pjruqhtcfxxbaqu',
			categoryId: 1,
			accountId: 1,
			flow: 600
		});

		expect(transaction).toHaveLength(1);
	});

	test('get transaction', async () => {
		expect(
			await getUserTransaction('pjruqhtcfxxbaqu', transaction[0].id)
		).toBeDefined();
	});
});
