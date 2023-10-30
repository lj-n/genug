import { createTeam, useTeamAuth } from '$lib/server/team';
import { useUserAuth } from '$lib/server/user';
import { describe, expect, test } from 'vitest';

const testUserId = 'qh1jpx6731v8w7v';

describe('team auth', () => {
	let teamId: number;

	test('create team', () => {
		const teamname = 'Cool Name';
		const description = 'Cool description';
		const team = createTeam({ userId: testUserId, teamname, description });

		teamId = team.id;

		expect(team.name).toBe(teamname);
		expect(team.description).toBe(description);

		expect(() =>
			createTeam({ userId: 'asd', teamname: 'Throw', description: 'Throw' })
		).toThrowError();
	});

	test('get team role', () => {
		expect(useTeamAuth(teamId, testUserId).getRole()).toBe('OWNER');

		expect(() => useTeamAuth(teamId, 'asdf').getRole()).toThrowError();
	});

	let otherUserId: string;
	test('invite user', async () => {
		const teamAuth = useTeamAuth(teamId, testUserId);

		const { user } = await useUserAuth().createUser('Other User', 'pwd');
		otherUserId = user.userId;
		teamAuth.inviteUser(otherUserId);

		const members = teamAuth.getMembers();

		expect(members).toHaveLength(2);
		expect(members).toContainEqual({
			role: 'INVITED',
			user: {
				id: otherUserId,
				name: user.name
			}
		});

		expect(() => teamAuth.inviteUser('asdd')).toThrowError();
		expect(() => teamAuth.inviteUser(testUserId)).toThrowError();
	});

	test('accept invitation', () => {
		const teamAuth = useTeamAuth(teamId, otherUserId);
		teamAuth.acceptInvite();

		const members = teamAuth.getMembers();

		expect(members).toHaveLength(2);
		expect(teamAuth.getRole()).toBe('MEMBER');
		expect(members).toContainEqual({
			role: 'MEMBER',
			user: {
				id: otherUserId,
				name: 'Other User'
			}
		});

		expect(() => teamAuth.acceptInvite()).toThrowError();
	});

	test('cancel invitation', async () => {
		const teamAuth = useTeamAuth(teamId, testUserId);

		const { user } = await useUserAuth().createUser('Another User', 'pwd');
		teamAuth.inviteUser(user.userId);

		useTeamAuth(teamId, user.userId).cancelInvite();

		const members = teamAuth.getMembers();

		expect(members).toHaveLength(2);
		expect(() => useTeamAuth(teamId, user.userId).getRole()).toThrowError();
	});

	test('make member owner', () => {
		const teamAuth = useTeamAuth(teamId, testUserId);
		teamAuth.makeMemberOwner(otherUserId);

		const members = teamAuth.getMembers();
		expect(members).toContainEqual({
			role: 'OWNER',
			user: {
				id: otherUserId,
				name: 'Other User'
			}
		});
	});

	test('remove member', () => {
		const teamAuth = useTeamAuth(teamId, testUserId);
		teamAuth.removeMember(otherUserId);

		const members = teamAuth.getMembers();
		expect(members).toHaveLength(1);
	});
});
