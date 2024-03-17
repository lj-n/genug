import type { User } from 'lucia';
import type { Database } from './db';
import { beforeEach, describe, expect, test } from 'vitest';
import { useTestDatabase } from '$testing/create.test.db';
import { schema } from './schema';
import { createTeam, createTeamMember } from './teams';
import { getTransactions } from './transactions';

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

describe('transactions', () => {
	test('', () => {
		const team = createTeam(db, user.id, 'Test Team');

		const [userAccount, teamAccount] = db
			.insert(schema.account)
			.values([
				{
					userId: user.id,
					name: 'Test Account'
				},
				{
					userId: user.id,
					name: 'Team Test Account',
					teamId: team.id
				}
			])
			.returning()
			.all();

		const [userCategory, teamCategory] = db
			.insert(schema.category)
			.values([
				{
					userId: user.id,
					name: 'Test Category'
				},
				{
					userId: user.id,
					name: 'Team Test Category',
					teamId: team.id
				}
			])
			.returning()
			.all();

		createTeamMember(db, team.id, user2.id, 'MEMBER');

		/** Create Transactions */
		db.insert(schema.transaction)
			.values([
				{
					userId: user.id,
					accountId: userAccount.id,
					categoryId: userCategory.id,
					flow: -5000,
					date: new Date().toISOString().substring(0, 7),
					validated: false
				},
				{
					userId: user.id,
					accountId: teamAccount.id,
					categoryId: teamCategory.id,
					flow: -5000,
					date: new Date().toISOString().substring(0, 7),
					validated: false
				}
			])
			.run();

		const filterOptions = {
			teams: [],
			accounts: [],
			categories: [],
			limit: 10000,
			offset: 0,
			page: 1
		};

		const transactions = getTransactions(db, user.id, filterOptions);
		const transactionsUser2 = getTransactions(db, user2.id, filterOptions);

		expect(transactions).toHaveLength(2);
		expect(transactionsUser2).toHaveLength(1);
	});
});
