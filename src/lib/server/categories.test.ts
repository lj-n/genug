import type { User } from 'lucia';
import type { Database } from './db';
import { beforeEach, describe, expect, test } from 'vitest';
import { useTestDatabase } from '$testing/create.test.db';
import { schema } from './schema';
import { createTeam, createTeamMember, updateTeamMemberRole } from './teams';
import {
	getCategories,
	getCategory,
	getCategoryDetails,
	updateCategory
} from './categories';
import { setBudget } from './budgets';

let db: Database;
let user: User;
let user2: User;

beforeEach(() => {
	const { database, client, testUser, testUser2 } = useTestDatabase();
	db = database;
	user = testUser;
	user2 = testUser2;

	return () => client.close();
});

describe('categories', () => {
	test('get categories', () => {
		const [team, team2, foreignTeam] = [
			createTeam(db, user.id, 'Test Team'),
			createTeam(db, user.id, 'Test Team 2'),
			// foreign team (user should not have access to this team)
			createTeam(db, user2.id, 'Foreign Test Team')
		];

		// invite user2 to team
		createTeamMember(db, team.id, user2.id, 'INVITED');

		const [category, category2, teamCategory] = db
			.insert(schema.category)
			.values([
				{
					userId: user.id,
					name: 'Test Category'
				},
				{
					userId: user.id,
					name: 'Test Category 2'
				},
				{
					userId: user.id,
					name: 'Test Team Category',
					teamId: team.id
				},
				// foreign categories (user should not have access to these categories)
				{
					userId: user2.id,
					name: 'Foreign Test Category'
				},
				{
					userId: user2.id,
					name: 'Foreign Test Team Category',
					teamId: foreignTeam.id
				}
			])
			.returning()
			.all();

		expect(getCategory(db, user.id, category.id)).toEqual(category);
		expect(getCategory(db, user.id, category2.id)).toEqual(category2);
		expect(getCategory(db, user2.id, category.id)).toBeNull();

		expect(getCategories(db, user.id)).toMatchObject([
			{
				id: category.id,
				name: category.name,
				team: null
			},
			{
				id: category2.id,
				name: category2.name,
				team: null
			},
			{
				id: teamCategory.id,
				name: teamCategory.name,
				team: team
			}
		]);
	});

	test('get category details', () => {
		const category = db
			.insert(schema.category)
			.values({
				userId: user.id,
				name: 'Test Category'
			})
			.returning()
			.get();
		const account = db
			.insert(schema.account)
			.values({
				userId: user.id,
				name: 'Test Account'
			})
			.returning()
			.get();

		db.insert(schema.transaction)
			.values([
				{
					userId: user.id,
					categoryId: category.id,
					accountId: account.id,
					flow: 1000,
					validated: true
				},
				{
					userId: user.id,
					categoryId: category.id,
					accountId: account.id,
					flow: -3000,
					validated: true
				}
			])
			.run();

		setBudget(db, user.id, {
			categoryId: category.id,
			amount: 1000,
			date: new Date().toISOString().slice(0, 7)
		});

		const details = getCategoryDetails(db, category.id);

		expect(details).toEqual({
			transactionCount: 2,
			transactionSum: -2000,
			budgetSum: 1000
		});
	});

	test('update category', () => {
		const [team, foreignTeam] = [
			createTeam(db, user.id, 'Test Team'),
			createTeam(db, user2.id, 'Foreign Test Team')
		];

		const [userCategory, teamCategory, foreignTeamCategory] = db
			.insert(schema.category)
			.values([
				{
					userId: user.id,
					name: 'User Category'
				},
				{
					userId: user.id,
					teamId: team.id,
					name: 'Team Category'
				},
				{
					userId: user2.id,
					teamId: foreignTeam.id,
					name: 'Foreign Team Category'
				}
			])
			.returning()
			.all();

		const newName = 'New Name';
		updateCategory(db, user.id, userCategory.id, {
			name: newName
		});

		expect(getCategory(db, user.id, userCategory.id)).toEqual({
			...userCategory,
			name: newName
		});

		updateCategory(db, user.id, teamCategory.id, {
			name: newName
		});

		expect(getCategory(db, user.id, teamCategory.id)).toEqual({
			...teamCategory,
			name: newName
		});

		expect(() =>
			updateCategory(db, user.id, foreignTeamCategory.id, {
				name: newName
			})
		).toThrow('Category not found');

		createTeamMember(db, foreignTeam.id, user.id, 'INVITED');

		expect(() =>
			updateCategory(db, user.id, foreignTeamCategory.id, {
				name: newName
			})
		).toThrow('Category not found');

		updateTeamMemberRole(db, foreignTeam.id, user.id, 'MEMBER');

		expect(() =>
			updateCategory(db, user.id, foreignTeamCategory.id, {
				name: newName
			})
		).toThrow('Must be team owner');
	});

	test('sort categories', () => {
		const [category1, category2, category3] = db
			.insert(schema.category)
			.values([
				{
					userId: user.id,
					name: 'Category 1'
				},
				{
					userId: user.id,
					name: 'Category 2'
				},
				{
					userId: user.id,
					name: 'Category 3'
				}
			])
			.returning()
			.all();

		const customOrder = [category3.id, category1.id, category2.id];

		db.insert(schema.userSettings)
			.values({ userId: user.id, categoryOrder: customOrder })
			.run();

		expect(getCategories(db, user.id)).toMatchObject([
			{ id: category3.id },
			{ id: category1.id },
			{ id: category2.id }
		]);

		updateCategory(db, user.id, category1.id, { retired: true });

		expect(getCategories(db, user.id)).toMatchObject([
			{ id: category3.id },
			{ id: category2.id }
		]);
	});
});
