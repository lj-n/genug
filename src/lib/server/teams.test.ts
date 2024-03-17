import { beforeEach, describe, expect, test } from 'vitest';
import type { Database } from './db';
import { useTestDatabase } from '$testing/create.test.db';
import {
	createTeam,
	deleteTeam,
	getTeam,
	getTeams,
	getTeamRole,
	createTeamMember,
	removeTeamMember,
	updateTeamMemberRole,
	findUsersNotInTeam
} from './teams';
import { generateId, type User } from 'lucia';
import { schema } from './schema';

let db: Database;
let user: User;
let user2: User;

beforeEach(() => {
	const { database, client, testUser, testUser2 } = useTestDatabase();
	db = database;
	user = testUser;
	user2 = testUser2;

	return () => {
		client.close();
	};
});

describe('team', () => {
	test('create team', () => {
		const teamName = 'Test Team';
		const teamDescription = 'Test Team Description';

		const team = createTeam(db, user.id, teamName, teamDescription);

		expect(team.id).toBeDefined();
		expect(team.name).toBe(teamName);
		expect(team.description).toBe(teamDescription);
		expect(() =>
			createTeam(db, 'non-existing-user', teamName, teamDescription)
		).toThrow();
	});

	test('get team role', () => {
		const team = createTeam(db, user.id, 'teamName', 'teamDescription');
		expect(getTeamRole(db, team.id, user.id)).toBe('OWNER');
		expect(getTeamRole(db, team.id, 'not-owner')).toBe(null);
	});

	test('get team', () => {
		const team = createTeam(db, user.id, 'teamName', 'teamDescription');

		expect(getTeam(db, team.id)).toBeDefined();
		expect(getTeam(db, team.id)?.id).toBe(team.id);
		expect(getTeam(db, team.id)?.members.length).toBe(1);
	});

	test('get user teams', () => {
		createTeam(db, user.id, 'teamName', 'teamDescription');
		const userTeams = getTeams(db, user.id);
		expect(userTeams.length).toBe(1);
	});

	test('invite user to team', () => {
		const team = createTeam(db, user.id, 'teamName', 'teamDescription');

		createTeamMember(db, team.id, user2.id, 'INVITED');
		expect(getTeamRole(db, team.id, user2.id)).toBe('INVITED');

		expect(() => createTeamMember(db, team.id, user.id, 'INVITED')).toThrow();
		expect(() =>
			createTeamMember(db, team.id, 'non-existing-user', 'INVITED')
		).toThrow();
		expect(() => createTeamMember(db, -1, user2.id, 'INVITED')).toThrow();
	});

	test('accept team invite', () => {
		const team = createTeam(db, user.id, 'teamName', 'teamDescription');

		createTeamMember(db, team.id, user2.id, 'INVITED');
		updateTeamMemberRole(db, team.id, user2.id, 'MEMBER');

		expect(getTeamRole(db, team.id, user2.id)).toBe('MEMBER');
		expect(getTeam(db, team.id)?.members.length).toBe(2);
	});

	test('remove team member', () => {
		const team = createTeam(db, user.id, 'teamName', 'teamDescription');

		createTeamMember(db, team.id, user2.id, 'INVITED');

		expect(() => removeTeamMember(db, team.id, user.id)).toThrow();

		removeTeamMember(db, team.id, user2.id);

		expect(getTeam(db, team.id)?.members.length).toBe(1);
		expect(getTeamRole(db, team.id, user2.id)).toBe(null);
	});

	test('cancel team invite', () => {
		const team = createTeam(db, user.id, 'teamName', 'teamDescription');

		createTeamMember(db, team.id, user2.id, 'INVITED');
		removeTeamMember(db, team.id, user2.id);

		expect(getTeamRole(db, team.id, user2.id)).toBe(null);
	});

	test('delete team', () => {
		const team = createTeam(db, user.id, 'teamName', 'teamDescription');

		deleteTeam(db, team.id);
		expect(getTeam(db, team.id)).toBeUndefined();
		expect(getTeamRole(db, team.id, user.id)).toBe(null);
	});

	test('find users not in team', () => {
		const name1 = 'ABCDEF';
		const name2 = 'DEFGHI';
		const owner = db
			.insert(schema.user)
			.values([
				{
					id: generateId(15),
					name: name1,
					hashedPassword: '1234567890'
				},
				{
					id: generateId(15),
					name: name2,
					hashedPassword: '1234567890'
				}
			])
			.returning()
			.get();

		const team = createTeam(db, owner.id, 'teamName', 'teamDescription');

		expect(findUsersNotInTeam(db, team.id, name1).length).toBe(0);
		expect(findUsersNotInTeam(db, team.id, name2).length).toBe(1);
		expect(findUsersNotInTeam(db, team.id, 'non-existing-user').length).toBe(0);
		expect(findUsersNotInTeam(db, team.id, 'FGH')).toMatchObject([
			{ name: name2 }
		]);
		expect(findUsersNotInTeam(db, team.id, 'fgh').length).toBe(1);
		expect(findUsersNotInTeam(db, team.id, 'GHIX').length).toBe(0);
		expect(findUsersNotInTeam(db, team.id, '').length).toBe(3); // 2 users from test db
	});
});
