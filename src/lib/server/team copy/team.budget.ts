import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { schema } from '../schema';
import type { SelectTeamBudget } from '../schema/tables';

export function useTeamBudget(teamId: number) {
	/**
	 * Upserts a budget for a category and month.
	 * If the amount is 0 the budget gets deleted if it exists.
	 */
	function set({
		amount,
		date,
		categoryId,
		setBy
	}: Omit<SelectTeamBudget, 'teamId'>) {
		db.transaction(() => {
			if (amount === 0) {
				db.delete(schema.teamBudget)
					.where(
						and(
							eq(schema.teamBudget.date, date),
							eq(schema.teamBudget.teamId, teamId),
							eq(schema.teamBudget.categoryId, categoryId)
						)
					)
					.returning()
					.get();

				return;
			}

			db.insert(schema.teamBudget)
				.values({
					teamId,
					amount,
					categoryId,
					date,
					setBy
				})
				.onConflictDoUpdate({
					target: [
						schema.teamBudget.date,
						schema.teamBudget.categoryId,
						schema.teamBudget.teamId
					],
					set: { amount, categoryId, setBy }
				})
				.returning()
				.get();
		});
	}

	function get(month: string) {
		return categoriesWithBudget.all({ month, teamId });
	}

	return { set, get };
}

/**
 * Get each category for a team with the budget, activity and rest sum for a month.
 * @param {string} teamId
 * @param {string} month
 */
const categoriesWithBudget = db
	.select({
		category: schema.teamCategory,
		budget: sql<number>`coalesce(${schema.teamBudget.amount}, 0)`,
		activity: sql<number>`coalesce(sum(${schema.teamTransaction.flow}), 0)`,
		rest: sql<number>`
      coalesce((
        select sum(${schema.teamBudget.amount})
        from ${schema.teamBudget}
        where ${schema.teamBudget.teamId} = ${schema.teamCategory.teamId}
        and ${schema.teamBudget.categoryId} = ${schema.teamCategory.id}
        and ${schema.teamBudget.date} <= ${sql.placeholder('month')}
      ), 0)
      +
      coalesce((
        select sum(${schema.teamTransaction.flow})
        from ${schema.teamTransaction}
        where ${schema.teamTransaction.teamId} = ${schema.teamCategory.teamId}
        and ${schema.teamTransaction.categoryId} = ${schema.teamCategory.id}
        and strftime('%Y-%m', ${
					schema.teamTransaction.date
				}) <= ${sql.placeholder('month')}
      ), 0)
    `
	})
	.from(schema.teamCategory)
	.leftJoin(
		schema.teamBudget,
		and(
			eq(schema.teamBudget.date, sql.placeholder('month')),
			eq(schema.teamBudget.categoryId, schema.teamCategory.id)
		)
	)
	.leftJoin(
		schema.teamTransaction,
		and(
			eq(
				sql`strftime('%Y-%m', ${schema.teamTransaction.date})`,
				sql.placeholder('month')
			),
			eq(schema.teamTransaction.categoryId, schema.teamCategory.id)
		)
	)
	.where(eq(schema.teamCategory.teamId, sql.placeholder('teamId')))
	.groupBy(({ category }) => category.id)
	.prepare();
