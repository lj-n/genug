import { describe, expect, test, beforeAll } from 'vitest';
import { setupDataBase, teardownDataBase } from './setup';
import { createUser } from '$lib/server/user';
import type { User } from 'lucia';
import {
	addTeamMember,
	cancelUserInvitation,
	confirmUserInvitation,
	createTeam,
	getTeam,
	getTeamMemberRole,
	lookupUsersNotInTeam,
	removeTeamMember
} from '../routes/team/team.utils';

beforeAll(() => {
	const sqlFiles = [
		'database/0000_curved_jack_flag.sql',
		'database/9999_testing_data.sql'
	];

	setupDataBase(...sqlFiles);

	return () => {
		teardownDataBase();
	};
});

const testUser = {
	name: 'Herr Lehmann',
	email: 'lehmann@user.com',
	password: 'userpassword'
};

const testTeam = {
	name: 'Test Team',
	description: 'Test Team Description'
};

let user: User;
let teamId: number;

describe('user & teams', () => {
	test('create a user', async () => {
		user = await createUser(
			testUser.email,
			testUser.name,
			testUser.password,
			true
		);

		expect(user.userId).toBeDefined();
		expect(user.email).toBe(testUser.email.toLowerCase());
		expect(user.name).toBe(testUser.name);
		expect(user.emailVerified).toBe(true);
	});

	test('create a team', async () => {
		teamId = await createTeam(testTeam.name, user.userId, testTeam.description);

		expect(teamId).toBeDefined();
	});

	test('find user not in team by id', async () => {
		const foundUsers = await lookupUsersNotInTeam(
			'pjruqhtcfxxbaqu',
			user.userId,
			teamId
		);

		expect(foundUsers).toHaveLength(1);
		expect(foundUsers).toContainEqual({
			id: 'pjruqhtcfxxbaqu',
			name: 'Test User'
		});
	});

	let foundUser: Awaited<ReturnType<typeof lookupUsersNotInTeam>>[number];
	test('find user not in team by name', async () => {
		const foundUsers = await lookupUsersNotInTeam(
			'test user',
			user.userId,
			teamId
		);
		expect(foundUsers).toHaveLength(1);

		foundUser = foundUsers[0];

		expect(foundUsers).toContainEqual({
			id: 'pjruqhtcfxxbaqu',
			name: 'Test User'
		});
	});

	test('invite user to team', async () => {
		await addTeamMember(foundUser.id, teamId);

		const team = await getTeam(teamId);
		expect(team.member).toContainEqual({
			role: 'INVITED',
			user: {
				id: foundUser.id,
				name: foundUser.name
			}
		});
	});

	test('invite same user again', async () => {
		await expect(() =>
			addTeamMember(foundUser.id, teamId)
		).rejects.toThrowError();
	});

	test('cancel team invitation', async () => {
		await cancelUserInvitation(foundUser.id, teamId);

		const team = await getTeam(teamId);
		expect(team.member).toHaveLength(1);
		expect(team.member[0]).toStrictEqual({
			role: 'OWNER',
			user: {
				id: user.userId,
				name: user.name
			}
		});

		// invite again for next test
		await addTeamMember(foundUser.id, teamId);
	});

	test('accept team invitation', async () => {
		await confirmUserInvitation(foundUser.id, teamId);

		const team = await getTeam(teamId);
		expect(team.member).toContainEqual({
			role: 'MEMBER',
			user: {
				id: foundUser.id,
				name: foundUser.name
			}
		});
	});

	test('get roles in team', async () => {
		const role1 = await getTeamMemberRole(user.userId, teamId);
		const role2 = await getTeamMemberRole(foundUser.id, teamId);

		expect(role1).toBe('OWNER');
		expect(role2).toBe('MEMBER');
	});

	test('remove user from team', async () => {
		await removeTeamMember(foundUser.id, teamId);

		const team = await getTeam(teamId);
		expect(team.member).toHaveLength(1);
		expect(team.member[0]).toStrictEqual({
			role: 'OWNER',
			user: {
				id: user.userId,
				name: user.name
			}
		});
	});
});
