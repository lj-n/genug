import { db } from '$lib/server/db';
import { schema } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, test } from 'vitest';
import type {
	SelectUserAccount,
	SelectUserCategory
} from '$lib/server/schema/tables';
import {
	useUserBudget,
	useUserTransaction,
	useUserCategory,
	useUserAccount
} from '$lib/server/user';

const testUserId = 'qh1jpx6731v8w7v';
const userTransactions = useUserTransaction(testUserId);
const userCategories = useUserCategory(testUserId);
const userAccounts = useUserAccount(testUserId);
const userBudgets = useUserBudget(testUserId);

let testAccount1: SelectUserAccount;
let testAccount2: SelectUserAccount;
let testCategory1: SelectUserCategory;
let testCategory2: SelectUserCategory;
let emptyCategory: SelectUserCategory;

beforeAll(() => {
	testAccount1 = userAccounts.create({ name: 'Test Account1' });
	testAccount2 = userAccounts.create({ name: 'Test Account2' });
	testCategory1 = userCategories.create({ name: 'Test Category1' });
	testCategory2 = userCategories.create({ name: 'Test Category2' });
	emptyCategory = userCategories.create({ name: 'Empty Test Category' });

	return () => {
		userAccounts.remove(testAccount1.id);
		userAccounts.remove(testAccount2.id);
		userCategories.remove(testCategory1.id);
		userCategories.remove(testCategory2.id);
		userCategories.remove(emptyCategory.id);
	};
});

beforeEach(() => {
	const deleteAllTransaction = () => {
		const transactions = userTransactions.getAll();
		for (const { id } of transactions) {
			userTransactions.remove(id);
		}
	};
	const deleteAllBudgets = () => {
		db.delete(schema.userBudget)
			.where(eq(schema.userBudget.userId, testUserId))
			.returning()
			.all();
	};

	// past transactions
	userTransactions.create({
		accountId: testAccount1.id,
		categoryId: testCategory1.id,
		flow: -400,
		validated: false,
		date: '2023-09-24'
	});
	userTransactions.create({
		accountId: testAccount2.id,
		categoryId: testCategory2.id,
		flow: -600,
		validated: false,
		date: '2023-09-24'
	});
	// present transaction (month)
	userTransactions.create({
		accountId: testAccount1.id,
		categoryId: testCategory1.id,
		flow: -200,
		validated: false,
		date: '2023-10-24'
	});
	userTransactions.create({
		accountId: testAccount2.id,
		categoryId: testCategory2.id,
		flow: -700,
		validated: false,
		date: '2023-10-24'
	});
	// future transactions
	userTransactions.create({
		accountId: testAccount1.id,
		categoryId: testCategory1.id,
		flow: -100,
		validated: false,
		date: '2023-11-24'
	});
	userTransactions.create({
		accountId: testAccount2.id,
		categoryId: testCategory2.id,
		flow: -800,
		validated: false,
		date: '2023-11-24'
	});

	return () => {
		deleteAllTransaction();
		deleteAllBudgets();
	};
});

describe('user budgets', () => {
	test('get budget for every category', () => {
		userBudgets.set({
			amount: 900,
			categoryId: testCategory1.id,
			date: '2023-09'
		});
		userBudgets.set({
			amount: 500,
			categoryId: testCategory2.id,
			date: '2023-09'
		});
		userBudgets.set({
			amount: 300,
			categoryId: testCategory1.id,
			date: '2023-10'
		});
		userBudgets.set({
			amount: 1400,
			categoryId: testCategory2.id,
			date: '2023-10'
		});
		userBudgets.set({
			amount: 900,
			categoryId: testCategory1.id,
			date: '2023-11'
		});

		let categories = userBudgets.get('2023-09');

		expect(categories).toHaveLength(userCategories.getAll().length);

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

		categories = userBudgets.get('2023-10');

		expect(categories).toHaveLength(userCategories.getAll().length);

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

		categories = userBudgets.get('2023-11');

		expect(categories).toHaveLength(userCategories.getAll().length);

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

	test('upsert budget', () => {
		userBudgets.set({
			amount: 400,
			categoryId: testCategory1.id,
			date: '2023-10'
		});
		expect(db.select().from(schema.userBudget).all()).toHaveLength(1);

		userBudgets.set({
			amount: 800,
			categoryId: testCategory1.id,
			date: '2023-10'
		});
		expect(db.select().from(schema.userBudget).all()).toHaveLength(1);

		userBudgets.set({
			amount: 0,
			categoryId: testCategory1.id,
			date: '2023-10'
		});
		expect(db.select().from(schema.userBudget).all()).toHaveLength(0);
	});
});
