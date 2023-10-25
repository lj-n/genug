import { and, eq, lte, sql } from 'drizzle-orm';
import { db } from './db';
import { schema } from './schema';

const budgetsQuery = db.query.userBudget
	.findMany({
		where: (budget, { and, eq, sql }) => {
			return and(
				eq(budget.userId, sql.placeholder('userId')),
				eq(budget.date, sql.placeholder('date'))
			);
		},
		with: {
			category: {
				columns: {
					userId: false
				}
			}
		}
	})
	.prepare();

export const transactionActivityInMonth = db
	.select({
		sum: sql<number>`coalesce(sum(${schema.userTransaction.flow}), 0)`.as(
			'activity'
		),
		categoryId: schema.userCategory.id
	})
	.from(schema.userCategory)
	.leftJoin(
		schema.userTransaction,
		and(
			eq(schema.userTransaction.categoryId, schema.userCategory.id),
			eq(
				sql`strftime('%Y-%m', ${schema.userTransaction.date})`, // convert YYYY-MM-DD date to YYYY-MM
				sql.placeholder('date')
			)
		)
	)
	.where(eq(schema.userCategory.userId, sql.placeholder('userId')))
	.groupBy(({ categoryId }) => categoryId)
	.as('transactionActivityInMonth');

export const transactionSumForMonth = db
	.select({
		sum: sql<number>`coalesce(sum(${schema.userTransaction.flow}), 0)`.as(
			'transaction_sum'
		),
		categoryId: schema.userCategory.id
	})
	.from(schema.userCategory)
	.leftJoin(
		schema.userTransaction,
		and(
			eq(schema.userTransaction.categoryId, schema.userCategory.id),
			lte(
				sql`strftime('%Y-%m', ${schema.userTransaction.date})`, // convert transaction date to YYYY-MM
				sql.placeholder('date')
			)
		)
	)
	.where(eq(schema.userCategory.userId, sql.placeholder('userId')))
	.groupBy(({ categoryId }) => categoryId)
	.as('transactionSumForMonth');

export const budgetSumForMonth = db
	.select({
		sum: sql<number>`coalesce(sum(${schema.userBudget.amount}), 0)`.as(
			'budget_sum'
		),
		categoryId: schema.userCategory.id
	})
	.from(schema.userCategory)
	.leftJoin(
		schema.userBudget,
		and(
			eq(schema.userBudget.categoryId, schema.userCategory.id),
			lte(schema.userBudget.date, sql.placeholder('date'))
		)
	)
	.where(eq(schema.userCategory.userId, sql.placeholder('userId')))
	.groupBy(({ categoryId }) => categoryId)
	.as('budgetSumForMonth');

export const categoriesWithBudgetQuery = db
	.select({
    budget: sql<number>`coalesce(${schema.userBudget.amount}, 0)`,
		activity: transactionActivityInMonth.sum,
		rest: sql<number>`${budgetSumForMonth.sum} + ${transactionSumForMonth.sum}`,
		category: schema.userCategory
	})
	.from(schema.userCategory)
  .leftJoin(
    schema.userBudget,
    and(
      eq(schema.userBudget.userId, sql.placeholder('userId')),
      eq(schema.userBudget.categoryId, schema.userCategory.id),
      eq(schema.userBudget.date, sql.placeholder('date'))
    )
  )
	.leftJoin(
		transactionSumForMonth,
		eq(transactionSumForMonth.categoryId, schema.userCategory.id)
	)
	.leftJoin(
		budgetSumForMonth,
		eq(budgetSumForMonth.categoryId, schema.userCategory.id)
	)
	.leftJoin(
		transactionActivityInMonth,
		eq(transactionActivityInMonth.categoryId, schema.userCategory.id)
	)
	.prepare();

export class UserBudgets {
	userId: string;

	constructor(userId: string) {
		this.userId = userId;
	}

	set({
		amount,
		date,
		categoryId
	}: {
		amount: number;
		date: string;
		categoryId: number;
	}) {
		return db.transaction(() => {
			if (amount === 0) {
				db.delete(schema.userBudget)
					.where(
						and(
							eq(schema.userBudget.date, date),
							eq(schema.userBudget.userId, this.userId),
							eq(schema.userBudget.categoryId, categoryId)
						)
					)
					.returning()
					.get();

				return;
			}

			return db
				.insert(schema.userBudget)
				.values({
					userId: this.userId,
					amount,
					categoryId,
					date
				})
				.onConflictDoUpdate({
					target: [
						schema.userBudget.date,
						schema.userBudget.categoryId,
						schema.userBudget.userId
					],
					set: { amount, categoryId }
				})
				.returning()
				.get();
		});
	}

	get(date: string) {
		return budgetsQuery.all({ userId: this.userId, date });
	}
}
