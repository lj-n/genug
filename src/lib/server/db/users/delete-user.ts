import { auth, createDatabase, type Database, tables } from '$db';
import { users } from '$db';
import { and, eq, ne, notExists } from 'drizzle-orm';

export function deleteUser({ database, userId }: { database: Database; userId: string }) {
	database.transaction((tx) => {
		// Budgets wo dieser User der einzige Member ist → löschen
		const soloOwnerBudgets = tx
			.select({ budgetId: tables.usersToBudgets.budgetId })
			.from(tables.usersToBudgets)
			.where(
				and(
					eq(tables.usersToBudgets.userId, userId),
					notExists(
						tx
							.select()
							.from(tables.usersToBudgets)
							.where(
								and(
									eq(tables.usersToBudgets.budgetId, tables.usersToBudgets.budgetId),
									ne(tables.usersToBudgets.userId, userId)
								)
							)
					)
				)
			)
			.all();

		for (const { budgetId } of soloOwnerBudgets) {
			tx.delete(tables.budgets).where(eq(tables.budgets.id, budgetId)).run();
		}

		// Budgets wo dieser User OWNER ist aber noch andere Members hat → neuen Owner bestimmen
		const ownedBudgetsWithMembers = tx
			.select({ budgetId: tables.usersToBudgets.budgetId })
			.from(tables.usersToBudgets)
			.where(and(eq(tables.usersToBudgets.userId, userId), eq(tables.usersToBudgets.role, 'OWNER')))
			.all()
			.filter(({ budgetId }) => !soloOwnerBudgets.some((b) => b.budgetId === budgetId));

		for (const { budgetId } of ownedBudgetsWithMembers) {
			const nextMember = tx
				.select({ userId: tables.usersToBudgets.userId })
				.from(tables.usersToBudgets)
				.where(
					and(
						eq(tables.usersToBudgets.budgetId, budgetId),
						ne(tables.usersToBudgets.userId, userId)
					)
				)
				.limit(1)
				.get();

			if (nextMember) {
				tx.update(tables.usersToBudgets)
					.set({ role: 'OWNER' })
					.where(
						and(
							eq(tables.usersToBudgets.budgetId, budgetId),
							eq(tables.usersToBudgets.userId, nextMember.userId)
						)
					)
					.run();
			}
		}

		tx.delete(tables.users).where(eq(tables.users.id, userId)).run();
	});
}

if (import.meta.vitest) {
	const { expect, it } = import.meta.vitest;

	it('deleteUser', async () => {
		const db = createDatabase(':memory:');
		const username = 'testuser';
		const passwordHash = await auth.hashPassword({
			password: 'password123'
		});

		const user = await users.createUser({ database: db, passwordHash, username });

		await deleteUser({ database: db, userId: user.id });

		const foundUser = await users.getUserById({ database: db, id: user.id });

		expect(foundUser).toBeUndefined();
	});
}
