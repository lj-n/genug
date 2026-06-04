import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';

import { database, tables } from '$db';
import { and, eq, exists, ne, sql } from 'drizzle-orm';

export type BudgetUser = {
	id: string;
	name: string;
	role: typeof tables.usersToBudgets.$inferSelect.role;
};

export function orderByRole(roleColumn: SQLiteColumn) {
	return sql`
        CASE ${roleColumn} 
        WHEN 'OWNER' THEN 1 
        WHEN 'MEMBER' THEN 2 
        WHEN 'INVITEE' THEN 3 
        END
    `;
}

export function userHasRole(
	role: typeof tables.usersToBudgets.$inferInsert.role,
	budgetIdColumn: SQLiteColumn,
	userId: string,
	db = database
) {
	const roleCondition =
		role === 'MEMBER'
			? ne(tables.usersToBudgets.role, 'INVITEE')
			: eq(tables.usersToBudgets.role, role);

	return exists(
		db
			.select({ one: sql`1` })
			.from(tables.usersToBudgets)
			.where(
				and(
					eq(tables.usersToBudgets.userId, userId),
					eq(tables.usersToBudgets.budgetId, budgetIdColumn),
					roleCondition
				)
			)
	);
}
