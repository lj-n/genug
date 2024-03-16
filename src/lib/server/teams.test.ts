import { beforeEach, describe, expect, test } from 'vitest';
import type { Database } from './db';
import { useTestDatabase } from '$testing/create.test.db';
import {
	acceptTeamInvitation,
	cancelTeamInvitation,
	createTeam,
	deleteTeam,
	getTeam,
	getTeamRole,
	getTeams,
	inviteUserToTeam,
	removeTeamMember
} from './teams';

let db: Database;
let userId: string;
let user2Id: string;

beforeEach(() => {
	const { database, client, testUser, testUser2 } = useTestDatabase();
	db = database;
	userId = testUser.id;
	user2Id = testUser2.id;

	return () => {
		client.close();
	};
});

describe('team', () => {
	test('create team', () => {
		const teamName = 'Test Team';
		const teamDescription = 'Test Team Description';

		const team = createTeam(db, userId, teamName, teamDescription);

		expect(team.id).toBeDefined();
		expect(team.name).toBe(teamName);
		expect(team.description).toBe(teamDescription);
		expect(() =>
			createTeam(db, 'non-existing-user', teamName, teamDescription)
		).toThrow();
	});

	test('get team role', () => {
		const team = createTeam(db, userId, 'teamName', 'teamDescription');
		expect(getTeamRole(db, team.id, userId)).toBe('OWNER');
		expect(getTeamRole(db, team.id, 'not-owner')).toBe(null);
	});

	test('get team', () => {
		const team = createTeam(db, userId, 'teamName', 'teamDescription');

		expect(getTeam(db, team.id)).toBeDefined();
		expect(getTeam(db, team.id)?.id).toBe(team.id);
		expect(getTeam(db, team.id)?.members.length).toBe(1);
	});

	test('get user teams', () => {
		createTeam(db, userId, 'teamName', 'teamDescription');
		const userTeams = getTeams(db, userId);
		expect(userTeams.length).toBe(1);
	});

	test('invite user to team', () => {
		const team = createTeam(db, userId, 'teamName', 'teamDescription');

		inviteUserToTeam(db, team.id, user2Id);
		expect(getTeamRole(db, team.id, user2Id)).toBe('INVITED');

		expect(() => inviteUserToTeam(db, team.id, userId)).toThrow();
		expect(() => inviteUserToTeam(db, team.id, 'non-existing-user')).toThrow();
		expect(() => inviteUserToTeam(db, -1, user2Id)).toThrow();
	});

	test('accept team invite', () => {
		const team = createTeam(db, userId, 'teamName', 'teamDescription');

		inviteUserToTeam(db, team.id, user2Id);
		acceptTeamInvitation(db, team.id, user2Id);

		expect(getTeamRole(db, team.id, user2Id)).toBe('MEMBER');
		expect(getTeam(db, team.id)?.members.length).toBe(2);
		expect(() => acceptTeamInvitation(db, team.id, userId)).toThrow();
	});

	test('remove team member', () => {
		const team = createTeam(db, userId, 'teamName', 'teamDescription');

		inviteUserToTeam(db, team.id, user2Id);

		expect(() => removeTeamMember(db, team.id, userId)).toThrow();

		removeTeamMember(db, team.id, user2Id);

		expect(getTeam(db, team.id)?.members.length).toBe(1);
		expect(getTeamRole(db, team.id, user2Id)).toBe(null);
	});

	test('cancel team invite', () => {
		const team = createTeam(db, userId, 'teamName', 'teamDescription');

		inviteUserToTeam(db, team.id, user2Id);
		cancelTeamInvitation(db, team.id, user2Id);

		expect(getTeamRole(db, team.id, user2Id)).toBe(null);
	});

	test('delete team', () => {
		const team = createTeam(db, userId, 'teamName', 'teamDescription');

		deleteTeam(db, team.id);
		expect(getTeam(db, team.id)).toBeUndefined();
		expect(getTeamRole(db, team.id, userId)).toBe(null);
	});
});
