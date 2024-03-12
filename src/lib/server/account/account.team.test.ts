import { beforeAll, describe, expect, test } from 'vitest';
import type { Database } from '../db';
import { useTestDatabase } from '$testing/create.test.db';
import { createTeamAccount, updateTeamAccount } from './account.team';
import { user } from '../schema/tables';

let db: Database;
let userId: string;
let user2Id: string;
let teamId: number;

beforeAll(() => {
	const { database, client, testUser, testUser2, testTeam } = useTestDatabase();
	db = database;
	userId = testUser.id;
	user2Id = testUser2.id;
	teamId = testTeam.id;

	return () => {
		client.close();
	};
});

describe('team accounts', () => {
	let accountId: number;

	test('create team account', () => {
		const accountName = 'Test Team Account';
		const accountDescription = 'Test Team Account Description';
		const account = createTeamAccount(db, {
			name: accountName,
			description: accountDescription,
			teamId,
			createdBy: userId
		});

        accountId = account.id;

		expect(account.name).toBe(accountName);
		expect(account.teamId).toBe(teamId);
		expect(account.createdBy).toBe(userId);
		expect(account.description).toBe(accountDescription);

		expect(() =>
			createTeamAccount(db, {
				name: accountName,
				teamId,
				createdBy: 'non-existing-user'
			})
		).toThrow();
		expect(() =>
			createTeamAccount(db, {
				name: accountName,
				teamId: -1,
				createdBy: userId
			})
		).toThrow();
	});

	test('update team account', () => {
		const updatedAccount = updateTeamAccount(db, accountId, {
			name: 'Updated Team Account',
			description: 'Updated Team Account Description'
		});

		expect(updatedAccount.name).toBe('Updated Team Account');
		expect(updatedAccount.description).toBe('Updated Team Account Description');
	});

    test('', () => {
        
    })
});
