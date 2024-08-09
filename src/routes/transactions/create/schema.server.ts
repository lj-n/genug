import { browser } from '$app/environment';
import type { Database } from '$lib/server/db';
import { schema } from '$lib/server/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { createTransactionSchema } from './schema';
import type { User } from 'lucia';
import { checkIfTransactionIsAllowed } from '$lib/server/transactions';

// function accountAssociatedWithCategory(database: Database, userId: string, accountId: number, categoryId: number) {
// 	if(browser) {
// 		return true
// 	}
// 	// check if account and category are associated
// 	database.transaction(() => {
// 		const account = database.select().from(schema.account).where(and(eq(schema.account.id, accountId), eq(schema.account.userId, userId))).get()

// 		if (!account) {
// 			throw new Error('Account not found');
// 		}

// 		const category = database.select().from(schema.category).where(and(eq(schema.category.id, categoryId), eq(schema.category.userId, userId))).get()

// 		if (!category) {
// 			throw new Error('Category not found');
// 		}

// 		if (account.teamId !== category.teamId) {
// 			throw new Error('Account and category must be associated');
// 		}
// 	})
// }

export const createServerTransactionSchema = (database: Database, user: User) =>
	createTransactionSchema.transform((data, ctx) => {
		if (!data.categoryId) return data;

		const account = database
			.select()
			.from(schema.account)
			.where(
				and(
					eq(schema.account.id, data.accountId),
					eq(schema.account.userId, user.id)
				)
			)
			.get();

		if (!account) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Account not found',
				path: ['accountId']
			});

			return z.NEVER;
		}

		const category = database
			.select()
			.from(schema.category)
			.where(
				and(
					eq(schema.category.id, data.categoryId),
					eq(schema.category.userId, user.id)
				)
			)
			.get();

		if (!category) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Category not found',
				path: ['categoryId']
			});

			return z.NEVER;
		}

		if (account.teamId !== category.teamId) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Account and category must be associated',
				path: ['accountId', 'categoryId']
			});

			return z.NEVER;
		}

		return data;
	});
