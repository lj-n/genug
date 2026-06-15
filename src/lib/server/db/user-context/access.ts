import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';

import { tables } from '$db';
import { NotFoundError } from '$server/utils/not-found-error';
import { and, eq, exists, ne, sql } from 'drizzle-orm';

const budgetFK = new Map<AccessibleTable, SQLiteColumn>([
	[tables.accounts, tables.accounts.budgetId],
	[tables.budgets, tables.budgets.id],
	[tables.categories, tables.categories.budgetId],
	[tables.transactions, tables.transactions.budgetId],
	[tables.usersToBudgets, tables.usersToBudgets.budgetId]
]);

export type AccessibleTable =
	| typeof tables.accounts
	| typeof tables.budgets
	| typeof tables.categories
	| typeof tables.transactions
	| typeof tables.usersToBudgets;

export function accessGuard(budgetId: string, userId: string, db: App.Database) {
	if (
		!db
			.select({ id: tables.budgets.id })
			.from(tables.budgets)
			.where(and(hasAccess(tables.budgets, userId, db), eq(tables.budgets.id, budgetId)))
			.get()
	) {
		throw new NotFoundError();
	}
}

export function hasAccess(table: AccessibleTable, userId: string, db: App.Database) {
	return exists(
		db
			.select({ one: sql`1` })
			.from(tables.usersToBudgets)
			.where(
				and(
					eq(tables.usersToBudgets.userId, userId),
					eq(tables.usersToBudgets.budgetId, budgetFK.get(table)!),
					ne(tables.usersToBudgets.role, 'INVITEE')
				)
			)
	);
}

export function isOwner(table: AccessibleTable, userId: string, db: App.Database) {
	return exists(
		db
			.select({ one: sql`1` })
			.from(tables.usersToBudgets)
			.where(
				and(
					eq(tables.usersToBudgets.userId, userId),
					eq(tables.usersToBudgets.budgetId, budgetFK.get(table)!),
					eq(tables.usersToBudgets.role, 'OWNER')
				)
			)
	);
}

export function ownerGuard(budgetId: string, userId: string, db: App.Database) {
	if (
		!db
			.select({ id: tables.budgets.id })
			.from(tables.budgets)
			.where(and(isOwner(tables.budgets, userId, db), eq(tables.budgets.id, budgetId)))
			.get()
	) {
		throw new NotFoundError();
	}
}
