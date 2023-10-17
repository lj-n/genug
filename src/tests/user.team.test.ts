import { describe, expect, test, beforeAll } from 'vitest';
import { setupDataBase, teardownDataBase } from './setup';
import { createUser, loginUser } from '$lib/server/user';
import type { User } from 'lucia';
import { createTeam } from '$lib/server/team';

beforeAll(() => {
	setupDataBase();
	return () => {
		teardownDataBase();
	};
});

const testUser = {
	name: 'Test User',
	email: 'test@user.com',
	password: 'userpassword'
};
const testTeam = {
	name: 'Test Team',
	description: 'Test Team Description'
};

let user: User;

describe('user and teams', () => {
	describe('user', () => {
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

		test('use user key to create session', async () => {
			const session = await loginUser(testUser.email, testUser.password);

			expect(session).toBeDefined();
		});
	});

	describe('teams', () => {
		test('create a team', async () => {
			const team = await createTeam(
				testTeam.name,
				user.userId,
				testTeam.description
			);

			expect(team.id).toBeDefined();
			expect(team.name).toBe(testTeam.name);
			expect(team.description).toBe(testTeam.description);
		});
	});
});
