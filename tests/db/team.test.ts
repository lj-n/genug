import type { Team } from '$lib/server/schema/tables';
import {
	addTeamMember,
	cancelTeamInvitaion,
	confirmTeamInvitation,
	createTeam,
	getTeam,
	getTeamMemberRole,
	getTeams,
	lookupUsersNotInTeam,
	removeTeamMember,
	updateMemberRole
} from '$lib/server/teams';
import { createUser } from '$lib/server/user';
import type { User } from 'lucia';
import { describe, expect, test } from 'vitest';

/**
 * Present rows in the database:
 *    teams = [{ id: 1, name: 'Test Team' }]
 *    teamMember = [{ userId: 'pjruqhtcfxxbaqu', teamId: 1, role: 'OWNER' }]
 */

const testUserId = 'pjruqhtcfxxbaqu';
const testUserName = 'Test User';
const newTeamName = 'Awesome Team';

let tempTeam: Team;

describe('teams', () => {
	test('create team', () => {
		tempTeam = createTeam(testUserId, {
			name: newTeamName
		});

		expect(tempTeam.name).toBe(newTeamName);

		const team = getTeam(tempTeam.id);

		expect(team.member).toContainEqual({
			role: 'OWNER',
			user: {
				id: testUserId,
				name: testUserName
			}
		});
		expect(getTeams(testUserId)).toHaveLength(2);
	});

	test('get team member role', () => {
		const role = getTeamMemberRole(testUserId, tempTeam.id);
		expect(role).toBe('OWNER');
	});

	let tempUser: User;
	test('find user that is not yet in team', async () => {
		tempUser = await createUser(
			'other@user.com',
			'Faux McNonexistent',
			'password',
			true
		);

		const foundUsers = lookupUsersNotInTeam(
			tempUser.name,
			testUserId,
			tempTeam.id
		);

		expect(foundUsers).toContainEqual({
			name: tempUser.name,
			id: tempUser.userId
		});
	});

	test('invite user to team', () => {
		addTeamMember(tempUser.userId, tempTeam.id);

		const team = getTeam(tempTeam.id);

		expect(team.member).toContainEqual({
			role: 'INVITED',
			user: {
				id: tempUser.userId,
				name: tempUser.name
			}
		});
	});

	test('cancel team invitation', () => {
		cancelTeamInvitaion(tempUser.userId, tempTeam.id);
		const team = getTeam(tempTeam.id);

		expect(team.member).toHaveLength(1);
		expect(team.member).toContainEqual({
			role: 'OWNER',
			user: {
				id: testUserId,
				name: testUserName
			}
		});
	});

	test('accept team invitation', () => {
		addTeamMember(tempUser.userId, tempTeam.id);

		confirmTeamInvitation(tempUser.userId, tempTeam.id);

		const team = getTeam(tempTeam.id);

		expect(team.member).toHaveLength(2);
		expect(team.member).toContainEqual({
			role: 'MEMBER',
			user: {
				id: tempUser.userId,
				name: tempUser.name
			}
		});
	});

	test('change team member role', () => {
		updateMemberRole(tempUser.userId, tempTeam.id, 'OWNER');

		const team = getTeam(tempTeam.id);

		expect(team.member).toHaveLength(2);
		expect(team.member).toContainEqual({
			role: 'OWNER',
			user: {
				id: tempUser.userId,
				name: tempUser.name
			}
		});
	});

	test('remove member from team', () => {
		removeTeamMember(tempUser.userId, tempTeam.id);

		const team = getTeam(tempTeam.id);

		expect(team.member).toHaveLength(1);
		expect(team.member).toContainEqual({
			role: 'OWNER',
			user: {
				id: testUserId,
				name: testUserName
			}
		});
	});
});
