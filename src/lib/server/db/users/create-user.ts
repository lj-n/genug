import { auth, createDatabase, type Database, tables } from '$db';

export async function createUser({
	database,
	...userData
}: typeof tables.users.$inferInsert & {
	database: Database;
}): Promise<Omit<typeof tables.users.$inferSelect, 'passwordHash'>> {
	const [{ passwordHash: _, ...user }] = await database
		.insert(tables.users)
		.values(userData)
		.returning();

	return user;
}

if (import.meta.vitest) {
	const { expect, it } = import.meta.vitest;

	it('createUser', async () => {
		const db = createDatabase(':memory:');
		const username = 'testuser';
		const passwordHash = await auth.hashPassword({
			password: 'password123'
		});

		const user = await createUser({ database: db, passwordHash, username });

		expect(user).toHaveProperty('id');
		expect(user).toHaveProperty('createdAt');
		expect(user).toHaveProperty('isAdmin', false);
		expect(user).toHaveProperty('username', username);
	});

	it('createUser - duplicate username', async () => {
		const db = createDatabase(':memory:');
		const username = 'testuser';
		const passwordHash = await auth.hashPassword({
			password: 'password123'
		});

		await createUser({ database: db, passwordHash, username });

		await expect(createUser({ database: db, passwordHash, username })).rejects.toThrow();
	});
}
