import type { SQLiteSelect } from 'drizzle-orm/sqlite-core';

import { tables } from '$db';
import { and, asc, eq, sql } from 'drizzle-orm';

/**
 * Left-joins `userEntityOrder` and orders by custom position (unranked last),
 * then by `createdAt`.
 */
export function withOrder<T extends SQLiteSelect>(
	qb: T,
	entityTable: typeof tables.accounts | typeof tables.budgets | typeof tables.categories,
	entityType: typeof tables.userEntityOrder.$inferSelect.entityType,
	userId: string
) {
	return qb
		.leftJoin(
			tables.userEntityOrder,
			and(
				eq(tables.userEntityOrder.entityId, entityTable.id),
				eq(tables.userEntityOrder.entityType, entityType),
				eq(tables.userEntityOrder.userId, userId)
			)
		)
		.orderBy(
			sql`CASE WHEN ${tables.userEntityOrder.position} IS NULL THEN 1 ELSE 0 END`,
			asc(tables.userEntityOrder.position),
			asc(entityTable.createdAt)
		);
}
