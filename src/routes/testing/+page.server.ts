import { withAuth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { schema } from '$lib/server/schema';
import { and, eq, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { getLastMonthsNames } from '$lib/utils';

export const load: PageServerLoad = withAuth(async (_, user) => {
	const dingens = getLastMonthsNames(12)
		.reverse()
		.map(({ date, name }) => ({
			name,
      date,
			...prep.get({ month: date, userId: user.id, categoryId: 1 })
		}));

	return {
		dingens
	};
});

const prep = db
	.select({
		sum: sql<number>`coalesce(sum(${schema.userTransaction.flow}), 0)`,
		count: sql<number>`coalesce(count(${schema.userTransaction.flow}), 0)`
	})
	.from(schema.userTransaction)
	.where(
		and(
			eq(schema.userTransaction.userId, sql.placeholder('userId')),
			eq(schema.userTransaction.categoryId, sql.placeholder('categoryId')),
			eq(
				sql`strftime('%Y-%m', ${schema.userTransaction.date})`,
				sql.placeholder('month')
			)
		)
	)
	.prepare();
