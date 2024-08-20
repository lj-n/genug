import type { Database } from '$lib/server/db';
import { z } from 'zod';
import { transactionFormSchema } from './schema';
import type { User } from 'lucia';
import { getAccount } from '$lib/server/accounts';
import { getCategory } from '$lib/server/categories';

export const createServerTransactionFormSchema = (
	database: Database,
	user: User
) =>
	transactionFormSchema.transform((data, ctx) => {
		if (!data.categoryId) return data;

		const account = getAccount(database, user.id, data.accountId);

		if (!account) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Account not found',
				path: ['accountId']
			});

			return z.NEVER;
		}

		const category = getCategory(database, user.id, data.categoryId);

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
				message: 'Account and category must belong to the same team',
				path: ['categoryId']
			});
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'Account and category must belong to the same team',
				path: ['accountId']
			});

			return z.NEVER;
		}

		return data;
	});
