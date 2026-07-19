/**
 * The referee for ticket #195: every native-endpoint response is assembled
 * from real `user-context` output and decoded against the *published* contract
 * schemas (`docs/api/openapi.yaml`, built here via `buildOpenApiDocument`).
 * The pipeline ticket (#194) guards the envelope family; this file exercises
 * the entity, register, write-result, and transfer schemas as their endpoints
 * land, and asserts the fat-response bookkeeping (affected categories and
 * account balances) the contract requires.
 */

import { createDatabase, tables } from '$db';
import { createUserCtx } from '$db/user-context';
import { type Month, parseMonth } from '$lib/utils/month';
import addFormats from 'ajv-formats';
import Ajv2020, { type ValidateFunction } from 'ajv/dist/2020';
import { beforeEach, describe, expect, it } from 'vitest';

import { createBudgetWithUser } from '../../../test/fixtures';
import {
	createTransaction,
	createTransfer,
	deleteTransaction,
	editTransaction,
	editTransfer,
	getEnvelopeView,
	listAccounts,
	listBudgets,
	listCategories,
	listTransactions,
	reassign,
	setAssignment
} from './endpoints';
import { buildOpenApiDocument, type OpenApiDocument } from './openapi';

const doc = buildOpenApiDocument() as OpenApiDocument;
const month = parseMonth(202501) as Month;

/** JSON round-trip: what the HTTP layer actually puts on the wire. */
function onTheWire<T>(value: T): unknown {
	return JSON.parse(JSON.stringify(value));
}

const validators = new Map<string, ValidateFunction>();
function decode(schemaName: string, value: unknown) {
	let validate = validators.get(schemaName);
	if (!validate) {
		const ajv = new Ajv2020({ allErrors: true, strict: false });
		addFormats(ajv);
		validate = ajv.compile({
			$ref: `#/components/schemas/${schemaName}`,
			components: doc.components
		});
		validators.set(schemaName, validate);
	}
	const wire = onTheWire(value);
	expect(validate(wire), JSON.stringify(validate.errors, null, 2)).toBe(true);
	return wire;
}

function seed() {
	const db = createDatabase(':memory:');
	const { budget, user } = createBudgetWithUser(db);
	const ctx = createUserCtx(user.id, db);

	const groceries = db
		.insert(tables.categories)
		.values({ budgetId: budget.id, name: 'Groceries', notes: 'weekly', targetBalance: 40000 })
		.returning()
		.get();
	const fun = db
		.insert(tables.categories)
		.values({ budgetId: budget.id, name: 'Fun' })
		.returning()
		.get();
	const checking = db
		.insert(tables.accounts)
		.values({ budgetId: budget.id, name: 'Checking' })
		.returning()
		.get();
	const savings = db
		.insert(tables.accounts)
		.values({ budgetId: budget.id, name: 'Savings' })
		.returning()
		.get();

	// 1000.00 income, 200.00 assigned to Groceries, 50.00 spent from Groceries.
	db.insert(tables.transactions)
		.values({ accountId: checking.id, amount: 100000, budgetId: budget.id, date: '2025-01-02' })
		.run();
	db.insert(tables.budgetAssignments)
		.values({ amount: 20000, budgetId: budget.id, categoryId: groceries.id, month: 202501 })
		.run();
	const spend = db
		.insert(tables.transactions)
		.values({
			accountId: checking.id,
			amount: -5000,
			budgetId: budget.id,
			categoryId: groceries.id,
			date: '2025-01-15'
		})
		.returning()
		.get();

	return { budget, checking, ctx, fun, groceries, savings, spend, user };
}

let s: ReturnType<typeof seed>;
beforeEach(() => {
	s = seed();
});

describe('reference + envelope reads', () => {
	it('listBudgets rows decode against Budget', () => {
		const budgets = listBudgets(s.ctx);
		expect(budgets.length).toBe(1);
		for (const budget of budgets) decode('Budget', budget);
	});

	it('listAccounts rows decode against AccountSummary and carry balances', () => {
		const accounts = listAccounts(s.ctx, s.budget.id);
		for (const account of accounts) decode('AccountSummary', account);
		const checking = accounts.find((a) => a.id === s.checking.id);
		expect(checking?.balance).toBe(95000); // 100000 income − 5000 spend
	});

	it('listCategories rows decode against Category', () => {
		for (const category of listCategories(s.ctx, s.budget.id)) decode('Category', category);
	});

	it('getEnvelopeView decodes against EnvelopeView', () => {
		decode('EnvelopeView', getEnvelopeView(s.ctx, s.budget.id, month));
	});

	it('a read against an inaccessible budget is a 404', () => {
		expect(() => listAccounts(s.ctx, 'budget_missing')).toThrow(
			expect.objectContaining({ status: 404 })
		);
		expect(() => getEnvelopeView(s.ctx, 'budget_missing', month)).toThrow(
			expect.objectContaining({ status: 404 })
		);
	});
});

describe('transaction writes carry a fat response', () => {
	it('a categorised capture returns the affected category and account', () => {
		const result = createTransaction(
			s.ctx,
			s.user.id,
			{
				accountId: s.checking.id,
				amount: -2000,
				budgetId: s.budget.id,
				categoryId: s.fun.id,
				validated: false
			},
			month
		);
		decode('TransactionWriteResult', result);
		expect(result.envelope.categories.map((c) => c.categoryId)).toEqual([s.fun.id]);
		expect(result.accounts).toEqual([{ accountId: s.checking.id, balance: 93000 }]);
	});

	it('an income capture (no category) leaves envelope.categories empty', () => {
		const result = createTransaction(
			s.ctx,
			s.user.id,
			{ accountId: s.savings.id, amount: 5000, budgetId: s.budget.id, validated: false },
			month
		);
		decode('TransactionWriteResult', result);
		expect(result.envelope.categories).toEqual([]);
		expect(result.transaction.categoryId).toBeNull();
	});

	it('an edit that moves a transaction between categories reports both', () => {
		const result = editTransaction(
			s.ctx,
			s.spend.id,
			{ categoryId: s.fun.id, validated: false },
			month
		);
		decode('TransactionWriteResult', result);
		expect(new Set(result.envelope.categories.map((c) => c.categoryId))).toEqual(
			new Set([s.fun.id, s.groceries.id])
		);
	});

	it('a delete returns the removed id and recomputed aggregates', () => {
		const result = deleteTransaction(s.ctx, s.spend.id, month);
		decode('TransactionDeleteResult', result);
		expect(result.deletedIds).toEqual([s.spend.id]);
	});

	it('deleting a transfer leg removes both legs', () => {
		const { from } = createTransfer(s.ctx, {
			amount: 3000,
			budgetId: s.budget.id,
			fromAccountId: s.checking.id,
			toAccountId: s.savings.id
		});
		const result = deleteTransaction(s.ctx, from.id, month);
		decode('TransactionDeleteResult', result);
		expect(result.deletedIds.length).toBe(2);
	});
});

describe('assignments', () => {
	it('setAssignment returns an EnvelopeDelta for the affected category', () => {
		const delta = setAssignment(s.ctx, {
			amount: 30000,
			budgetId: s.budget.id,
			categoryId: s.fun.id,
			month
		});
		decode('EnvelopeDelta', delta);
		expect(delta.categories.map((c) => c.categoryId)).toEqual([s.fun.id]);
		expect(delta.categories[0].assigned).toBe(30000);
	});

	it('reassign to another category reports both; to Unassigned reports one', () => {
		const moved = reassign(s.ctx, {
			amount: 5000,
			budgetId: s.budget.id,
			month,
			sourceCategoryId: s.groceries.id,
			targetCategoryId: s.fun.id
		});
		decode('EnvelopeDelta', moved);
		expect(new Set(moved.categories.map((c) => c.categoryId))).toEqual(
			new Set([s.fun.id, s.groceries.id])
		);

		const returned = reassign(s.ctx, {
			amount: 5000,
			budgetId: s.budget.id,
			month,
			sourceCategoryId: s.groceries.id,
			targetCategoryId: null
		});
		decode('EnvelopeDelta', returned);
		expect(returned.categories.map((c) => c.categoryId)).toEqual([s.groceries.id]);
	});
});

describe('transfers', () => {
	it('createTransfer returns both legs and two account balances', () => {
		const result = createTransfer(s.ctx, {
			amount: 3000,
			budgetId: s.budget.id,
			fromAccountId: s.checking.id,
			toAccountId: s.savings.id
		});
		decode('TransferResult', result);
		expect(result.from.amount).toBe(-3000);
		expect(result.to.amount).toBe(3000);
		expect(result.accounts).toEqual([
			{ accountId: s.checking.id, balance: 92000 }, // 95000 − 3000
			{ accountId: s.savings.id, balance: 3000 }
		]);
	});

	it('editTransfer keeps both legs consistent and decodes against TransferResult', () => {
		const { from } = createTransfer(s.ctx, {
			amount: 3000,
			budgetId: s.budget.id,
			fromAccountId: s.checking.id,
			toAccountId: s.savings.id
		});
		const result = editTransfer(s.ctx, from.transferId!, { amount: 4000 });
		decode('TransferResult', result);
		expect(result.from.amount).toBe(-4000);
		expect(result.to.amount).toBe(4000);
	});
});

describe('register', () => {
	it('listTransactions decodes against TransactionPage and TransactionListItem', () => {
		const page = listTransactions(s.ctx, { accountId: s.checking.id, page: 1, pageSize: 15 });
		decode('TransactionPage', page);
		for (const row of page.rows) decode('TransactionListItem', row);
		expect(page.total).toBe(2);
	});

	it('the register of an inaccessible account is a 404', () => {
		expect(() =>
			listTransactions(s.ctx, { accountId: 'account_missing', page: 1, pageSize: 15 })
		).toThrow(expect.objectContaining({ status: 404 }));
	});
});
