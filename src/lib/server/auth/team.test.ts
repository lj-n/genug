import { beforeAll, describe, expect, test } from 'vitest';
import type { Database } from '../db';
import { useTestDatabase } from '$testing/create.test.db';
import {
	acceptTeamInvitation,
	cancelTeamInvitation,
	createTeam,
	deleteTeam,
	getTeam,
	getTeamRole,
	inviteUserToTeam,
	removeTeamMember
} from './team';

let db: Database;
let userId: string;
let user2Id: string;

beforeAll(() => {
	const { database, client, testUser, testUser2 } = useTestDatabase();
	db = database;
	userId = testUser.id;
	user2Id = testUser2.id;

	return () => {
		client.close();
	};
});

describe('team', () => {
	let teamId: number;

	test('create team', () => {
		const teamName = 'Test Team';
		const teamDescription = 'Test Team Description';

		const team = createTeam(db, userId, teamName, teamDescription);
		teamId = team.id;

		expect(team.id).toBeDefined();
		expect(team.name).toBe(teamName);
		expect(team.description).toBe(teamDescription);
	});

	test('get team role', () => {
		expect(getTeamRole(db, teamId, userId)).toBe('OWNER');
		expect(getTeamRole(db, teamId, 'not-owner')).toBe(null);
	});

	test('get team', () => {
		const team = getTeam(db, teamId);

		expect(team).toBeDefined();
		expect(team?.id).toBe(teamId);
		expect(team?.members.length).toBe(1);
	});

	test('invite user to team', () => {
		inviteUserToTeam(db, teamId, user2Id);
		expect(getTeamRole(db, teamId, user2Id)).toBe('INVITED');

		expect(() => inviteUserToTeam(db, teamId, userId)).toThrow();
		expect(() => inviteUserToTeam(db, teamId, 'non-existing-user')).toThrow();
		expect(() => inviteUserToTeam(db, -1, user2Id)).toThrow();
	});

	test('accept team invite', () => {
		acceptTeamInvitation(db, teamId, user2Id);
		expect(getTeamRole(db, teamId, user2Id)).toBe('MEMBER');
		expect(getTeam(db, teamId)?.members.length).toBe(2);

		expect(() => acceptTeamInvitation(db, teamId, userId)).toThrow();
	});

	test('remove team member', () => {
		expect(() => removeTeamMember(db, teamId, userId)).toThrow();

		removeTeamMember(db, teamId, user2Id);
		expect(getTeam(db, teamId)?.members.length).toBe(1);
		expect(getTeamRole(db, teamId, user2Id)).toBe(null);
	});

	test('cancel team invite', () => {
		inviteUserToTeam(db, teamId, user2Id);

		cancelTeamInvitation(db, teamId, user2Id);
		expect(getTeamRole(db, teamId, user2Id)).toBe(null);
	});

	test('delete team', () => {
		deleteTeam(db, teamId);
		expect(getTeam(db, teamId)).toBeUndefined();
		expect(getTeamRole(db, teamId, userId)).toBe(null);
	});
});
