import type { Team } from '$lib/server/teams';
import { User } from '$lib/server/user';
import { beforeAll, describe, expect, test } from 'vitest';

const testUserId = 'qh1jpx6731v8w7v';
const user = new User(testUserId);

beforeAll(() => {});

describe('teams', () => {
	let tempTeam: Team;

	test('create team', () => {
		const teamname = 'Test Team';
		const description = 'Test Team Description';

		tempTeam = user.team.create({ teamname, description });

		const info = tempTeam.info;
		const members = tempTeam.members;

		expect(info.name).toBe(teamname);
		expect(info.description).toBe(description);
		expect(members).toContainEqual({
			role: 'OWNER',
			user: { id: user.id, name: user.name }
		});
	});
  
	describe('members', () => {
		let tempUser: User;

		test('invite user', async () => {
			const {
				user: { userId }
			} = await User.create('Temp user', 'pwd');
			tempUser = new User(userId);

			tempTeam.invite(tempUser.id);

			const members = tempTeam.members;
			expect(members).toHaveLength(2);
			expect(members).toContainEqual({
				role: 'INVITED',
				user: { id: tempUser.id, name: tempUser.name }
			});
		});

		test('try to invite user again', () => {
			expect(() => tempTeam.invite(tempUser.id)).toThrowError(
				'User not found or already part of team/invited.'
			);
		});

		test('accept invite', () => {
			const team = tempUser.team.get(tempTeam.teamId);
			team.acceptInvite();

			expect(team.role).toBe('MEMBER');
			expect(team.members).toContainEqual({
				role: 'MEMBER',
				user: {
					id: tempUser.id,
					name: tempUser.name
				}
			});
		});

		test('try to accept invite again', () => {
			const team = tempUser.team.get(tempTeam.teamId);
			expect(() => team.acceptInvite()).toThrowError(
				`User(${tempUser.id}) is not invited. Role(${team.role})`
			);
		});

		test('cancel invite', async () => {
			const {
				user: { userId }
			} = await User.create('Third User', 'pwd');
			const thirdUser = new User(userId);

			tempTeam.invite(thirdUser.id);

			const team = thirdUser.team.get(tempTeam.teamId);
			team.cancelInvite();

			expect(tempTeam.members).toHaveLength(2);
		});

		test('try to set member role', () => {
			const team = tempUser.team.get(tempTeam.teamId);
			expect(() => team.makeMemberOwner(user.id)).toThrowError(
				'Only team owners can promote team member.'
			);
		});

		test('give member owner role', () => {
			tempTeam.makeMemberOwner(tempUser.id);

			expect(tempTeam.members).toContainEqual({
				role: 'OWNER',
				user: {
					id: tempUser.id,
					name: tempUser.name
				}
			});
		});

		test('remove member', () => {
			tempTeam.removeMember(tempUser.id);

			expect(tempTeam.members).toHaveLength(1);
			expect(tempTeam.members).toContainEqual({
				role: 'OWNER',
				user: { id: user.id, name: user.name }
			});
		});
	});
});
