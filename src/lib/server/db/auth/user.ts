import { database, type Database, tables } from '$db';
import { and, desc, eq, getColumns, ne, notExists } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';

import { deleteUserSessions, hashPassword } from './index';

export function createUser({
	db = database,
	...userData
}: typeof tables.users.$inferInsert & {
	db?: Database;
}) {
	const { passwordHash: _, ...columns } = getColumns(tables.users);
	return db.insert(tables.users).values(userData).returning(columns).get();
}

export function deleteUser({ db = database, userId }: { db?: Database; userId: string }) {
	db.transaction((tx) => {
		const otherMembers = alias(tables.usersToBudgets, 'other_members');
		const soloOwnerBudgets = tx
			.select({ budgetId: tables.usersToBudgets.budgetId })
			.from(tables.usersToBudgets)
			.where(
				and(
					eq(tables.usersToBudgets.userId, userId),
					notExists(
						tx
							.select()
							.from(otherMembers)
							.where(
								and(
									eq(otherMembers.budgetId, tables.usersToBudgets.budgetId),
									ne(otherMembers.userId, userId)
								)
							)
					)
				)
			)
			.all();

		for (const { budgetId } of soloOwnerBudgets) {
			tx.delete(tables.budgets).where(eq(tables.budgets.id, budgetId)).run();
		}

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

export function getAllUsers({ db = database }: { db?: Database } = {}) {
	const { id, username } = getColumns(tables.users);
	return db.select({ id, username }).from(tables.users).orderBy(desc(tables.users.isAdmin)).all();
}

export async function isFirstUser({ db = database }: { db?: Database } = {}) {
	return (await db.$count(tables.users)) === 0;
}

/**
 * Replaces the user's password with a fresh random one and signs the user out
 * everywhere; the returned plaintext is the only way into the account. Backs
 * the server-shell recovery CLI (ADR-0015).
 */
export async function resetPassword({
	db = database,
	username
}: {
	db?: Database;
	username: string;
}) {
	const user = await db.query.users.findFirst({ where: { username } });
	if (!user) throw new Error(`No user with username "${username}" exists`);

	const password = generatePassword();
	const passwordHash = await hashPassword({ password });
	db.update(tables.users).set({ passwordHash }).where(eq(tables.users.id, user.id)).run();
	deleteUserSessions({ db, userId: user.id });

	return password;
}

export async function setPassword({
	db = database,
	password,
	userId
}: {
	db?: Database;
	password: string;
	userId: string;
}) {
	const passwordHashValue = await hashPassword({ password });
	db.update(tables.users)
		.set({ passwordHash: passwordHashValue })
		.where(eq(tables.users.id, userId))
		.run();
}

export function setUsername({
	db = database,
	userId,
	username
}: {
	db?: Database;
	userId: string;
	username: string;
}) {
	db.update(tables.users).set({ username }).where(eq(tables.users.id, userId)).run();
}

/**
 * Generates a random password that satisfies `PasswordSchema` by construction:
 * 16 characters (within the 8–20 bounds) ending in a guaranteed digit and
 * special character, each drawn uniformly via `randomIndex`.
 */
function generatePassword() {
	const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
	const digits = '0123456789';
	const specials = '!@#$%^&*?';
	const chars = Array.from({ length: 14 }, () => alphabet[randomIndex(alphabet.length)]);
	chars.push(digits[randomIndex(digits.length)]);
	chars.push(specials[randomIndex(specials.length)]);
	return chars.join('');
}

/**
 * Returns an unbiased integer in `[0, max)` drawn from the same crypto-random
 * source as `createSessionToken`. Plain `randomByte % max` skews toward the low
 * end whenever `max` does not divide 256 evenly, so bytes in the biased tail are
 * rejected and re-rolled (rejection sampling) before the modulo is taken.
 */
function randomIndex(max: number): number {
	const limit = 256 - (256 % max);
	const buffer = new Uint8Array(1);
	let byte: number;
	do {
		byte = crypto.getRandomValues(buffer)[0];
	} while (byte >= limit);
	return byte % max;
}
