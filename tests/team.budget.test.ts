import { db } from '$lib/server/db';
import { schema } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, test } from 'vitest';
import type {
	SelectTeamAccount,
	SelectTeamCategory
} from '$lib/server/schema/tables';
import {
	createTeam,
	useTeamAccount,
	useTeamBudget,
	useTeamCategory,
	useTeamTransaction
} from '$lib/server/team';

const testUserId = 'qh1jpx6731v8w7v';

let testAccount1: SelectTeamAccount;
let testAccount2: SelectTeamAccount;
let testCategory1: SelectTeamCategory;
let testCategory2: SelectTeamCategory;
let emptyCategory: SelectTeamCategory;

let teamId: number;

beforeAll(() => {
	const team = createTeam({ userId: testUserId, teamname: 'Testteam' });
	teamId = team.id;

	const teamAccount = useTeamAccount(teamId);
	const teamCategory = useTeamCategory(teamId);

	testAccount1 = teamAccount.create({
		name: 'Test Account1',
		createdBy: testUserId
	});
	testAccount2 = teamAccount.create({
		name: 'Test Account2',
		createdBy: testUserId
	});
	testCategory1 = teamCategory.create({
		name: 'Test Category1',
		createdBy: testUserId
	});
	testCategory2 = teamCategory.create({
		name: 'Test Category2',
		createdBy: testUserId
	});
	emptyCategory = teamCategory.create({
		name: 'Empty Test Category',
		createdBy: testUserId
	});

	return () => {
		teamAccount.remove(testAccount1.id);
		teamAccount.remove(testAccount2.id);
		teamCategory.remove(testCategory1.id);
		teamCategory.remove(testCategory2.id);
		teamCategory.remove(emptyCategory.id);
	};
});

beforeEach(() => {
	const teamTransaction = useTeamTransaction(teamId);
	const deleteAllTransaction = () => {
		const transactions = teamTransaction.getAll();
		for (const { id } of transactions) {
			teamTransaction.remove(id);
		}
	};
	const deleteAllBudgets = () => {
		db.delete(schema.teamBudget)
			.where(eq(schema.teamBudget.teamId, teamId))
			.returning()
			.all();
	};

	// past transactions
	teamTransaction.create({
		accountId: testAccount1.id,
		categoryId: testCategory1.id,
		flow: -400,
		validated: false,
		date: '2023-09-24',
		createdBy: testUserId
	});
	teamTransaction.create({
		accountId: testAccount2.id,
		categoryId: testCategory2.id,
		flow: -600,
		validated: false,
		date: '2023-09-24',
		createdBy: testUserId
	});
	// present transaction (month)
	teamTransaction.create({
		accountId: testAccount1.id,
		categoryId: testCategory1.id,
		flow: -200,
		validated: false,
		date: '2023-10-24',
		createdBy: testUserId
	});
	teamTransaction.create({
		accountId: testAccount2.id,
		categoryId: testCategory2.id,
		flow: -700,
		validated: false,
		date: '2023-10-24',
		createdBy: testUserId
	});
	// future transactions
	teamTransaction.create({
		accountId: testAccount1.id,
		categoryId: testCategory1.id,
		flow: -100,
		validated: false,
		date: '2023-11-24',
		createdBy: testUserId
	});
	teamTransaction.create({
		accountId: testAccount2.id,
		categoryId: testCategory2.id,
		flow: -800,
		validated: false,
		date: '2023-11-24',
		createdBy: testUserId
	});

	return () => {
		deleteAllTransaction();
		deleteAllBudgets();
	};
});

describe('user budgets', () => {
	test('get budget for every category', () => {
		const teamBudget = useTeamBudget(teamId);
		const teamCategory = useTeamCategory(teamId);

		teamBudget.set({
			amount: 900,
			categoryId: testCategory1.id,
			date: '2023-09',
			setBy: testUserId
		});
		teamBudget.set({
			amount: 500,
			categoryId: testCategory2.id,
			date: '2023-09',
			setBy: testUserId
		});
		teamBudget.set({
			amount: 300,
			categoryId: testCategory1.id,
			date: '2023-10',
			setBy: testUserId
		});
		teamBudget.set({
			amount: 1400,
			categoryId: testCategory2.id,
			date: '2023-10',
			setBy: testUserId
		});
		teamBudget.set({
			amount: 900,
			categoryId: testCategory1.id,
			date: '2023-11',
			setBy: testUserId
		});

		let categories = teamBudget.get('2023-09');

		expect(categories).toHaveLength(teamCategory.getAll().length);

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

		categories = teamBudget.get('2023-10');

		expect(categories).toHaveLength(teamCategory.getAll().length);

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

		categories = teamBudget.get('2023-11');

		expect(categories).toHaveLength(teamCategory.getAll().length);

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
		const teamBudget = useTeamBudget(teamId);

		teamBudget.set({
			amount: 400,
			categoryId: testCategory1.id,
			date: '2023-10',
			setBy: testUserId
		});
		expect(db.select().from(schema.teamBudget).all()).toHaveLength(1);

		teamBudget.set({
			amount: 800,
			categoryId: testCategory1.id,
			date: '2023-10',
			setBy: testUserId
		});
		expect(db.select().from(schema.teamBudget).all()).toHaveLength(1);

		teamBudget.set({
			amount: 0,
			categoryId: testCategory1.id,
			date: '2023-10',
			setBy: testUserId
		});
		expect(db.select().from(schema.teamBudget).all()).toHaveLength(0);
	});
});
