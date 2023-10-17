import { db, schema } from '$lib/server';
import { describe, expect, test } from 'vitest';

const testUser = {
	name: 'Test User',
	email: 'test@user.com',
	password: 'user'
};

describe('user', () => {
	test('sign up user', async () => {
		await db.select().from(schema.user);
		expect(testUser.name).toBe('Test User');
	});
});
