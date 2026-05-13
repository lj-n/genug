import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';

import { tables } from '$db';
import { and, eq, sql } from 'drizzle-orm';

export function pendingAccountBalance({
	accountId,
	database
}: {
	accountId: SQLiteColumn;
	database: App.Database;
}) {
	return database
		.select({
			pending: sql<number>`coalesce(sum(${tables.transactions.amount}), 0)`
		})
		.from(tables.transactions)
		.where(
			and(eq(tables.transactions.accountId, accountId), eq(tables.transactions.validated, false))
		);
}

export function validatedAccountBalance({
	accountId,
	database
}: {
	accountId: SQLiteColumn;
	database: App.Database;
}) {
	return database
		.select({
			validated: sql<number>`coalesce(sum(${tables.transactions.amount}), 0)`
		})
		.from(tables.transactions)
		.where(
			and(eq(tables.transactions.accountId, accountId), eq(tables.transactions.validated, true))
		);
}
