import { useTestDatabase } from '$testing/create.test.db';
import { beforeEach, describe, expect, test } from 'vitest';
import type { Database } from './db';
import type { User } from 'lucia';
import { schema } from './schema';
import { createTeam } from './teams';
import { getAccountsWithBalance } from './accounts';

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

describe('accounts', () => {
	test('get accounts with balances', () => {
		const userAccount = db
			.insert(schema.account)
			.values({
				userId: user.id,
				name: 'Testaccount User'
			})
			.returning()
			.get();

		const [team] = [
			createTeam(db, user.id, 'Test Team'),
			createTeam(db, user.id, 'Test Team 2')
		];
		const foreignTeam = createTeam(db, user2.id, 'Foreign Team');

		const [teamAccount, teamAccount2] = db
			.insert(schema.account)
			.values([
				{
					userId: user.id,
					name: 'Testaccount Team',
					teamId: team.id
				},
				{
					userId: user.id,
					name: 'Testaccount Team 2',
					teamId: team.id
				},
				/**
				 * create a second team account
				 * (the user should not have access to this account)
				 */
				{
					userId: user2.id,
					name: 'Testaccount Foreign Team',
					teamId: foreignTeam.id
				}
			])
			.returning()
			.all();

		/** Create Categories */
		const [userCategory, userCategory2] = db
			.insert(schema.category)
			.values([
				{
					userId: user.id,
					name: 'Testcategory'
				},
				{
					userId: user.id,
					name: 'Testcategory 2'
				}
			])
			.returning()
			.all();
		const [teamCategory, teamCategory2] = db
			.insert(schema.category)
			.values([
				{
					userId: user.id,
					name: 'Testcategory Team',
					teamId: team.id
				},
				{
					userId: user.id,
					name: 'Testcategory Team 2',
					teamId: team.id
				}
			])
			.returning()
			.all();

		/** Create Transactions */
		db.insert(schema.transaction)
			.values([
				{
					userId: user.id,
					accountId: userAccount.id,
					flow: 20000,
					validated: true
				},
				{
					userId: user.id,
					accountId: userAccount.id,
					flow: -5000,
					validated: true
				},
				{
					userId: user.id,
					accountId: userAccount.id,
					flow: -2000,
					validated: false
				},
				{
					userId: user.id,
					accountId: userAccount.id,
					categoryId: userCategory.id,
					flow: -2000,
					validated: true
				},
				{
					userId: user.id,
					accountId: userAccount.id,
					categoryId: userCategory.id,
					flow: -2000,
					validated: false
				},
				{
					userId: user.id,
					accountId: userAccount.id,
					categoryId: userCategory2.id,
					flow: -2000,
					validated: true
				},
				{
					userId: user.id,
					accountId: teamAccount.id,
					flow: 12000,
					validated: true
				},
				{
					userId: user.id,
					accountId: teamAccount.id,
					flow: -3000,
					validated: true
				},
				{
					userId: user.id,
					accountId: teamAccount.id,
					flow: -1000,
					validated: false
				},
				{
					userId: user.id,
					accountId: teamAccount.id,
					categoryId: teamCategory.id,
					flow: -4000,
					validated: true
				},
				{
					userId: user.id,
					accountId: teamAccount.id,
					categoryId: teamCategory.id,
					flow: -500,
					validated: false
				},
				{
					userId: user.id,
					accountId: teamAccount.id,
					categoryId: teamCategory2.id,
					flow: -4000,
					validated: true
				},
				{
					userId: user.id,
					accountId: teamAccount2.id,
					flow: 10000,
					validated: true
				},
				{
					userId: user.id,
					accountId: teamAccount2.id,
					categoryId: teamCategory2.id,
					flow: -1500,
					validated: false
				}
			])
			.returning()
			.all();

		const accounts = getAccountsWithBalance(db, user.id);

		expect(accounts).toMatchObject([
			{
				id: userAccount.id,
				name: userAccount.name,
				team: null,
				count: 6,
				validated: 11000,
				pending: -4000,
				working: 7000
			},
			{
				id: teamAccount.id,
				name: teamAccount.name,
				team: {
					id: team.id,
					name: team.name
				},
				count: 6,
				validated: 1000,
				pending: -1500,
				working: -500
			},
			{
				id: teamAccount2.id,
				name: teamAccount2.name,
				team: {
					id: team.id,
					name: team.name
				},
				count: 2,
				validated: 10000,
				pending: -1500,
				working: 8500
			}
		]);
	});
});
