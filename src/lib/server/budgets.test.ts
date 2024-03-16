import { beforeEach, describe, expect, test } from 'vitest';
import type { Database } from './db';
import { useTestDatabase } from '$testing/create.test.db';
import {
	createDummyData,
	createDummyDataWithTeams
} from '$testing/budget.dummy.data';
import { getBudget, getSleepingMoney, setBudget } from './budgets';
import { getMonthInFormat } from '$lib/components/date.utils';

let db: Database;
let userId: string;
let userId2: string;

beforeEach(() => {
	const { database, client, testUser, testUser2 } = useTestDatabase();
	db = database;
	userId = testUser.id;
	userId2 = testUser2.id;

	return () => {
		client.close();
	};
});

describe('budgets', () => {
	const currentDate = new Date();
	const previousMonth = new Date(currentDate);
	previousMonth.setMonth(currentDate.getMonth() - 1);
	const nextMonth = new Date(currentDate);
	nextMonth.setMonth(currentDate.getMonth() + 1);

	test('create a budget', () => {
		createDummyData(db, userId);

		const budgetPrevious = getBudget(
			db,
			userId,
			getMonthInFormat(previousMonth)
		);
		const budgetCurrent = getBudget(db, userId, getMonthInFormat(currentDate));
		const budgetNext = getBudget(db, userId, getMonthInFormat(nextMonth));
		const sleepingMoney = getSleepingMoney(db, userId);

		expect(budgetPrevious).toMatchObject([
			{
				category: { name: 'Category 1' },
				budget: 0,
				activity: 1200,
				rest: 1200
			},
			{
				category: { name: 'Category 2' },
				budget: 0,
				activity: -2300,
				rest: -2300
			}
		]);
		expect(budgetCurrent).toMatchObject([
			{
				category: { name: 'Category 1' },
				budget: 0,
				activity: -400,
				rest: 800
			},
			{
				category: { name: 'Category 2' },
				budget: 0,
				activity: -3700,
				rest: -6000
			}
		]);
		expect(budgetNext).toMatchObject([
			{ category: { name: 'Category 1' }, budget: 0, activity: -800, rest: 0 },
			{
				category: { name: 'Category 2' },
				budget: 0,
				activity: -300,
				rest: -6300
			}
		]);

		expect(sleepingMoney.personal).toBe(1800);
		expect(sleepingMoney.teams).toHaveLength(0);
	});

	test('create a budget (with budget amounts)', () => {
		const [category1, category2] = createDummyData(db, userId);

		setBudget(db, userId, {
			categoryId: category1.id,
			date: getMonthInFormat(previousMonth),
			amount: 900
		});
		setBudget(db, userId, {
			categoryId: category2.id,
			date: getMonthInFormat(previousMonth),
			amount: 3000
		});

		setBudget(db, userId, {
			categoryId: category1.id,
			date: getMonthInFormat(currentDate),
			amount: 0
		});
		setBudget(db, userId, {
			categoryId: category2.id,
			date: getMonthInFormat(currentDate),
			amount: 450
		});

		setBudget(db, userId, {
			categoryId: category1.id,
			date: getMonthInFormat(nextMonth),
			amount: -200
		});
		setBudget(db, userId, {
			categoryId: category2.id,
			date: getMonthInFormat(nextMonth),
			amount: 4500
		});

		const budgetPrevious = getBudget(
			db,
			userId,
			getMonthInFormat(previousMonth)
		);
		const budgetCurrent = getBudget(db, userId, getMonthInFormat(currentDate));
		const budgetNext = getBudget(db, userId, getMonthInFormat(nextMonth));
		const sleepingMoney = getSleepingMoney(db, userId);

		expect(budgetPrevious).toMatchObject([
			{
				category: { name: 'Category 1' },
				budget: 900,
				activity: 1200,
				rest: 2100
			},
			{
				category: { name: 'Category 2' },
				budget: 3000,
				activity: -2300,
				rest: 700
			}
		]);
		expect(budgetCurrent).toMatchObject([
			{
				category: { name: 'Category 1' },
				budget: 0,
				activity: -400,
				rest: 1700
			},
			{
				category: { name: 'Category 2' },
				budget: 450,
				activity: -3700,
				rest: -2550
			}
		]);
		expect(budgetNext).toMatchObject([
			{
				category: { name: 'Category 1' },
				budget: -200,
				activity: -800,
				rest: 700
			},
			{
				category: { name: 'Category 2' },
				budget: 4500,
				activity: -300,
				rest: 1650
			}
		]);

		expect(sleepingMoney.personal).toBe(-6850);
		expect(sleepingMoney.teams).toHaveLength(0);
	});

	test('create a budget (with team categories)', () => {
		const { team1, team2 } = createDummyDataWithTeams(db, userId, userId2);

		const budgetPrevious = getBudget(
			db,
			userId,
			getMonthInFormat(previousMonth)
		);
		const budgetCurrent = getBudget(db, userId, getMonthInFormat(currentDate));
		const budgetNext = getBudget(db, userId, getMonthInFormat(nextMonth));
		const sleepingMoney = getSleepingMoney(db, userId);

		expect(budgetPrevious).toMatchObject([
			{
				category: { name: 'Category 1' },
				budget: 0,
				activity: 1200,
				rest: 1200
			},
			{
				category: { name: 'Category 2' },
				budget: 0,
				activity: -2300,
				rest: -2300
			},
			{
				category: { name: 'Team Category 1' },
				budget: 0,
				activity: -1800,
				rest: -1800
			},
			{
				category: { name: 'Team Category 2' },
				budget: 0,
				activity: -1300,
				rest: -1300
			}
		]);
		expect(budgetCurrent).toMatchObject([
			{
				category: { name: 'Category 1' },
				budget: 0,
				activity: -400,
				rest: 800
			},
			{
				category: { name: 'Category 2' },
				budget: 0,
				activity: -3700,
				rest: -6000
			},
			{
				category: { name: 'Team Category 1' },
				budget: 0,
				activity: -400,
				rest: -2200
			},
			{
				category: { name: 'Team Category 2' },
				budget: 0,
				activity: -2100,
				rest: -3400
			}
		]);
		expect(budgetNext).toMatchObject([
			{ category: { name: 'Category 1' }, budget: 0, activity: -800, rest: 0 },
			{
				category: { name: 'Category 2' },
				budget: 0,
				activity: -300,
				rest: -6300
			},
			{
				category: { name: 'Team Category 1' },
				budget: 0,
				activity: -100,
				rest: -2300
			},
			{
				category: { name: 'Team Category 2' },
				budget: 0,
				activity: 0,
				rest: -3400
			}
		]);

		expect(sleepingMoney.personal).toBe(1800);
		expect(sleepingMoney.teams).toHaveLength(2);
		expect(sleepingMoney.teams).toEqual([
			{
				id: team1.id,
				name: team1.name,
				sum: 1900
			},
			{
				id: team2.id,
				name: team2.name,
				sum: 6750
			}
		]);
	});

	test('create a budget (with team categories and budget amounts)', () => {
		const { category1, category2, teamCategory1, teamCategory2, team1, team2 } =
			createDummyDataWithTeams(db, userId, userId2);

		/** User Category Budgets */
		setBudget(db, userId, {
			categoryId: category1.id,
			date: getMonthInFormat(previousMonth),
			amount: 900
		});
		setBudget(db, userId, {
			categoryId: category2.id,
			date: getMonthInFormat(previousMonth),
			amount: 3000
		});

		setBudget(db, userId, {
			categoryId: category1.id,
			date: getMonthInFormat(currentDate),
			amount: 0
		});
		setBudget(db, userId, {
			categoryId: category2.id,
			date: getMonthInFormat(currentDate),
			amount: 450
		});

		setBudget(db, userId, {
			categoryId: category1.id,
			date: getMonthInFormat(nextMonth),
			amount: -200
		});
		setBudget(db, userId, {
			categoryId: category2.id,
			date: getMonthInFormat(nextMonth),
			amount: 4500
		});

		/** Team Category Budgets */
		setBudget(db, userId, {
			categoryId: teamCategory1.id,
			date: getMonthInFormat(previousMonth),
			amount: 1000
		});
		setBudget(db, userId, {
			categoryId: teamCategory2.id,
			date: getMonthInFormat(previousMonth),
			amount: 0
		});

		setBudget(db, userId, {
			categoryId: teamCategory1.id,
			date: getMonthInFormat(currentDate),
			amount: 1000
		});
		setBudget(db, userId, {
			categoryId: teamCategory2.id,
			date: getMonthInFormat(currentDate),
			amount: 5000
		});

		setBudget(db, userId, {
			categoryId: teamCategory1.id,
			date: getMonthInFormat(nextMonth),
			amount: 900
		});
		setBudget(db, userId, {
			categoryId: teamCategory2.id,
			date: getMonthInFormat(nextMonth),
			amount: -200
		});

		const budgetPrevious = getBudget(
			db,
			userId,
			getMonthInFormat(previousMonth)
		);
		const budgetCurrent = getBudget(db, userId, getMonthInFormat(currentDate));
		const budgetNext = getBudget(db, userId, getMonthInFormat(nextMonth));
		const sleepingMoney = getSleepingMoney(db, userId);

		expect(budgetPrevious).toMatchObject([
			{
				category: { name: 'Category 1' },
				budget: 900,
				activity: 1200,
				rest: 2100
			},
			{
				category: { name: 'Category 2' },
				budget: 3000,
				activity: -2300,
				rest: 700
			},
			{
				category: { name: 'Team Category 1' },
				budget: 1000,
				activity: -1800,
				rest: -800
			},
			{
				category: { name: 'Team Category 2' },
				budget: 0,
				activity: -1300,
				rest: -1300
			}
		]);
		expect(budgetCurrent).toMatchObject([
			{
				category: { name: 'Category 1' },
				budget: 0,
				activity: -400,
				rest: 1700
			},
			{
				category: { name: 'Category 2' },
				budget: 450,
				activity: -3700,
				rest: -2550
			},
			{
				category: { name: 'Team Category 1' },
				budget: 1000,
				activity: -400,
				rest: -200
			},
			{
				category: { name: 'Team Category 2' },
				budget: 5000,
				activity: -2100,
				rest: 1600
			}
		]);
		expect(budgetNext).toMatchObject([
			{
				category: { name: 'Category 1' },
				budget: -200,
				activity: -800,
				rest: 700
			},
			{
				category: { name: 'Category 2' },
				budget: 4500,
				activity: -300,
				rest: 1650
			},
			{
				category: { name: 'Team Category 1' },
				budget: 900,
				activity: -100,
				rest: 600
			},
			{
				category: { name: 'Team Category 2' },
				budget: -200,
				activity: 0,
				rest: 1400
			}
		]);

		expect(sleepingMoney.personal).toBe(-6850);
		expect(sleepingMoney.teams).toHaveLength(2);
		expect(sleepingMoney.teams).toEqual([
			{
				id: team1.id,
				name: team1.name,
				sum: -1000
			},
			{
				id: team2.id,
				name: team2.name,
				sum: 1950
			}
		]);
	});

	test('throw error if user is not allowed set budget for category', () => {
		const { teamCategory3 } = createDummyDataWithTeams(db, userId, userId2);

		expect(() =>
			setBudget(db, userId, {
				categoryId: teamCategory3.id,
				date: getMonthInFormat(previousMonth),
				amount: 900
			})
		).toThrowError('Category not found.');
	});
});
