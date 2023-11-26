import { beforeAll, describe, expect, test } from 'vitest';
import type { Database } from '../db';
import { useTestDatabase } from '$testing/create.test.db';
import { createUserAccount } from '../account/account.user';
import { createUserCategory } from '../category/category.user';
import { createUserTransaction } from '../transaction/transaction.user';
import { getUserBudgets, setUserBudget } from './budget.user';
import type { schema } from '../schema';

let db: Database;
let userId: string;

let accountId: number;
let category1: typeof schema.userCategory.$inferSelect;
let category2: typeof schema.userCategory.$inferSelect;

const CURRENT_DATE = new Date().toISOString().slice(0, 7);

beforeAll(() => {
	const { client, database, testUser } = useTestDatabase();
	db = database;
	userId = testUser.id;

	const account = createUserAccount(db, {
		userId,
		name: 'Temporary Account'
	});
	accountId = account.id;

	category1 = createUserCategory(db, {
		userId,
		name: 'Temporary Category 1'
	});

	category2 = createUserCategory(db, {
		userId,
		name: 'Temporary Category 2'
	});

	return () => {
		client.close();
	};
});

describe('user budgets', () => {
	test('empty budget values', () => {
		const budgets = getUserBudgets(db, userId, CURRENT_DATE);

		expect(budgets).toHaveLength(2);
		expect(budgets).toContainEqual({
			category: category1,
			budget: 0,
			activity: 0,
			rest: 0
		});
		expect(budgets).toContainEqual({
			category: category2,
			budget: 0,
			activity: 0,
			rest: 0
		});
	});

	test('budgets values after creating transactions', () => {
		createUserTransaction(db, {
			userId,
			accountId,
			categoryId: category1.id,
			flow: 100,
			validated: true
		});
		createUserTransaction(db, {
			userId,
			accountId,
			categoryId: category1.id,
			flow: -500,
			validated: true
		});
		createUserTransaction(db, {
			userId,
			accountId,
			categoryId: category2.id,
			flow: -200,
			validated: true
		});

		const budgets = getUserBudgets(db, userId, CURRENT_DATE);

		expect(budgets).toHaveLength(2);
		expect(budgets).toContainEqual({
			category: category1,
			budget: 0,
			activity: -400,
			rest: -400
		});
		expect(budgets).toContainEqual({
			category: category2,
			budget: 0,
			activity: -200,
			rest: -200
		});
	});

	test('budget values after setting budgets', () => {
		setUserBudget(db, userId, {
			categoryId: category1.id,
			amount: 1000,
			date: CURRENT_DATE
		});

		const date = new Date();
		date.setMonth(date.getMonth() - 1);
		const LAST_MONTH_DATE = date.toISOString().slice(0, 7);
		setUserBudget(db, userId, {
			categoryId: category2.id,
			amount: 800,
			date: LAST_MONTH_DATE
		});

		const budgets = getUserBudgets(db, userId, CURRENT_DATE);

		expect(budgets).toHaveLength(2);
		expect(budgets).toContainEqual({
			category: category1,
			budget: 1000,
			activity: -400,
			rest: 600
		});
		expect(budgets).toContainEqual({
			category: category2,
			budget: 0,
			activity: -200,
			rest: 600
		});
	});

	test('current budget values after setting future budgets', () => {
		const date = new Date();
		date.setMonth(date.getMonth() + 1);
		const FUTURE_DATE = date.toISOString().slice(0, 7);
		setUserBudget(db, userId, {
			categoryId: category1.id,
			amount: 1000,
			date: FUTURE_DATE
		});

		const budgets = getUserBudgets(db, userId, CURRENT_DATE);

		expect(budgets).toHaveLength(2);
		expect(budgets).toContainEqual({
			category: category1,
			budget: 1000,
			activity: -400,
			rest: 600
		});
		expect(budgets).toContainEqual({
			category: category2,
			budget: 0,
			activity: -200,
			rest: 600
		});

		const futureBudgets = getUserBudgets(db, userId, FUTURE_DATE);

		expect(futureBudgets).toHaveLength(2);
		expect(futureBudgets).toContainEqual({
			category: category1,
			budget: 1000,
			activity: 0,
			rest: 1600
		});
		expect(futureBudgets).toContainEqual({
			category: category2,
			budget: 0,
			activity: 0,
			rest: 600
		});
	});
});
