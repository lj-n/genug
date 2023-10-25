import { db } from '$lib/server';
import {
	budgetSumForMonth,
	categoriesWithBudgetQuery,
	transactionActivityInMonth,
	transactionSumForMonth
} from '$lib/server/budgets';
import { schema } from '$lib/server/schema';
import { User } from '$lib/server/user';
import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, test } from 'vitest';
import type { UserAccount, UserCategory } from '$lib/server/schema/tables';

const testUserId = 'pjruqhtcfxxbaqu';
const user = new User(testUserId);

let testAccount1: UserAccount;
let testAccount2: UserAccount;
let testCategory1: UserCategory;
let testCategory2: UserCategory;
let emptyCategory: UserCategory;

beforeAll(() => {
	testAccount1 = user.accounts.create({ name: 'Test Account' });
	testAccount2 = user.accounts.create({ name: 'Test Account' });
	testCategory1 = user.categories.create({ name: 'Test Category' });
	testCategory2 = user.categories.create({ name: 'Test Category' });
	emptyCategory = user.categories.create({ name: 'Empty Category' });

	return () => {
		user.accounts.delete(testAccount1.id);
		user.accounts.delete(testAccount2.id);
		user.categories.delete(testCategory1.id);
		user.categories.delete(testCategory2.id);
		user.categories.delete(emptyCategory.id);
	};
});

beforeEach(() => {
	const deleteAllTransaction = () => {
		const transactions = user.transactions.getAll();
		for (const { id } of transactions) {
			user.transactions.delete(id);
		}
	};

	// past transactions
	user.transactions.create({
		accountId: testAccount1.id,
		categoryId: testCategory1.id,
		flow: -400,
		validated: false,
		date: '2023-09-24'
	});
	user.transactions.create({
		accountId: testAccount2.id,
		categoryId: testCategory2.id,
		flow: -600,
		validated: false,
		date: '2023-09-24'
	});
	// present transaction (month)
	user.transactions.create({
		accountId: testAccount1.id,
		categoryId: testCategory1.id,
		flow: -200,
		validated: false,
		date: '2023-10-24'
	});
	user.transactions.create({
		accountId: testAccount2.id,
		categoryId: testCategory2.id,
		flow: -700,
		validated: false,
		date: '2023-10-24'
	});
	// future transactions
	user.transactions.create({
		accountId: testAccount1.id,
		categoryId: testCategory1.id,
		flow: -100,
		validated: false,
		date: '2023-11-24'
	});
	user.transactions.create({
		accountId: testAccount2.id,
		categoryId: testCategory2.id,
		flow: -800,
		validated: false,
		date: '2023-11-24'
	});

	return () => {
		deleteAllTransaction();
		db.delete(schema.userBudget)
			.where(eq(schema.userBudget.userId, user.id))
			.returning()
			.all();
	};
});

describe('user budgets', () => {
	describe('for every category', () => {
		test('get the sum of transactions in a month', () => {
			const transactionActivities1 = db
				.select()
				.from(transactionActivityInMonth)
				.all({ date: '2023-10', userId: user.id });

			expect(transactionActivities1).toHaveLength(
				user.categories.getAll().length
			);
			expect(transactionActivities1).toContainEqual({
				categoryId: testCategory1.id,
				sum: -200
			});
			expect(transactionActivities1).toContainEqual({
				categoryId: testCategory2.id,
				sum: -700
			});
			expect(transactionActivities1).toContainEqual({
				categoryId: emptyCategory.id,
				sum: 0
			});
		});

		test('get the sum of transactions up to and for this month', () => {
			const transactionSum = db
				.select()
				.from(transactionSumForMonth)
				.all({ date: '2023-10', userId: user.id });

			expect(transactionSum).toHaveLength(user.categories.getAll().length);

			expect(transactionSum).toContainEqual({
				categoryId: testCategory1.id,
				sum: -600
			});
			expect(transactionSum).toContainEqual({
				categoryId: testCategory2.id,
				sum: -1300
			});
			expect(transactionSum).toContainEqual({
				categoryId: emptyCategory.id,
				sum: 0
			});
		});

		test('get the sum of budget amounts up to and for this month', () => {
			user.budgets.set({
				amount: 500,
				categoryId: testCategory1.id,
				date: '2023-09'
			});
			user.budgets.set({
				amount: 300,
				categoryId: testCategory1.id,
				date: '2023-10'
			});
			user.budgets.set({
				amount: 200,
				categoryId: testCategory2.id,
				date: '2023-10'
			});
			user.budgets.set({
				amount: 200,
				categoryId: testCategory2.id,
				date: '2023-11'
			});

			const budgetSum = db
				.select()
				.from(budgetSumForMonth)
				.all({ date: '2023-10', userId: user.id });

			expect(budgetSum).toHaveLength(user.categories.getAll().length);

			expect(budgetSum).toContainEqual({
				categoryId: testCategory1.id,
				sum: 800
			});
			expect(budgetSum).toContainEqual({
				categoryId: testCategory2.id,
				sum: 200
			});
			expect(budgetSum).toContainEqual({
				categoryId: emptyCategory.id,
				sum: 0
			});
		});

		test('get the whole budget data', () => {
			user.budgets.set({
				amount: 900,
				categoryId: testCategory1.id,
				date: '2023-09'
			});
			user.budgets.set({
				amount: 500,
				categoryId: testCategory2.id,
				date: '2023-09'
			});
			user.budgets.set({
				amount: 300,
				categoryId: testCategory1.id,
				date: '2023-10'
			});
			user.budgets.set({
				amount: 1400,
				categoryId: testCategory2.id,
				date: '2023-10'
			});
			user.budgets.set({
				amount: 900,
				categoryId: testCategory1.id,
				date: '2023-11'
			});

			let categories = categoriesWithBudgetQuery.all({
				date: '2023-09',
				userId: user.id
			});

			expect(categories).toHaveLength(user.categories.getAll().length);

			expect(categories).toContainEqual({
				budget: 900,
				activity: -400,
				rest: 500,
				category: testCategory1
			});
			expect(categories).toContainEqual({
				budget: 500,
				activity: -600,
				rest: -100,
				category: testCategory2
			});

			categories = categoriesWithBudgetQuery.all({
				date: '2023-10',
				userId: user.id
			});

			expect(categories).toHaveLength(user.categories.getAll().length);

			expect(categories).toContainEqual({
				budget: 300,
				activity: -200,
				rest: 600,
				category: testCategory1
			});
			expect(categories).toContainEqual({
				budget: 1400,
				activity: -700,
				rest: 600,
				category: testCategory2
			});

			categories = categoriesWithBudgetQuery.all({
				date: '2023-11',
				userId: user.id
			});

			expect(categories).toHaveLength(user.categories.getAll().length);

			expect(categories).toContainEqual({
				budget: 900,
				activity: -100,
				rest: 1400,
				category: testCategory1
			});
			expect(categories).toContainEqual({
				budget: 0,
				activity: -800,
				rest: -200,
				category: testCategory2
			});


		});
	});

  test('upsert budget', () => {
    user.budgets.set({ amount: 400, categoryId: testCategory1.id, date: '2023-10'})
    expect(db.select().from(schema.userBudget).all()).toHaveLength(1)
    
    user.budgets.set({ amount: 800, categoryId: testCategory1.id, date: '2023-10'})
    expect(db.select().from(schema.userBudget).all()).toHaveLength(1)
    
    user.budgets.set({ amount: 0, categoryId: testCategory1.id, date: '2023-10'})
    expect(db.select().from(schema.userBudget).all()).toHaveLength(0)
  })
});
