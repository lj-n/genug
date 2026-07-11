import { createDatabase, type Database, tables } from '$db';
import { type Month, parseMonth } from '$lib/utils/month';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { createBudgetWithUser } from '../../../../test/fixtures';
import { categoryBalances, unassigned } from './envelope';

/**
 * Seed helpers — keep the test surface small and direct.
 */

function seedAccount(db: Database, budgetId: string, name: string) {
	return db.insert(tables.accounts).values({ budgetId, name }).returning().get();
}

function seedAssignment(
	db: Database,
	budgetId: string,
	categoryId: string,
	month: Month,
	amount: number
) {
	db.insert(tables.budgetAssignments).values({ amount, budgetId, categoryId, month }).run();
}

function seedCategory(db: Database, budgetId: string, name: string) {
	return db.insert(tables.categories).values({ budgetId, name }).returning().get();
}

function seedTransaction(
	db: Database,
	budgetId: string,
	accountId: string,
	categoryId: null | string,
	date: string,
	amount: number,
	validated = true
) {
	db.insert(tables.transactions)
		.values({ accountId, amount, budgetId, categoryId, date, validated })
		.run();
}

describe('categoryBalances', () => {
	const month = parseMonth(202501)!;
	const prevMonth = parseMonth(202412)!;
	const nextMonth = parseMonth(202502)!;

	it('returns the named column families for a category with data', () => {
		const db = createDatabase(':memory:');
		const { budget } = createBudgetWithUser(db);
		const account = seedAccount(db, budget.id, 'Checking');
		const cat = seedCategory(db, budget.id, 'Groceries');

		seedAssignment(db, budget.id, cat.id, month, 30000); // €300.00 in Jan
		seedTransaction(db, budget.id, account.id, cat.id, '2025-01-15', -12000); // -€120.00

		const bal = categoryBalances(db, month);
		const [row] = db.select().from(bal).where(eq(bal.categoryId, cat.id)).all();

		expect(row).toBeDefined();
		// all-time family
		expect(row.allTimeRemaining).toBe(18000); // 30000 + (-12000)
		expect(row.allTimeAssignmentSum).toBe(30000);
		expect(row.allTimeTransactionSum).toBe(-12000);
		expect(row.pendingCount).toBe(0);
		expect(row.txCount).toBe(1);
		expect(row.assignCount).toBe(1);
		// month family
		expect(row.assigned).toBe(30000);
		expect(row.activity).toBe(-12000);
		expect(row.remaining).toBe(18000);
	});

	it('rolls Remaining across months — prior-month contributions are included', () => {
		const db = createDatabase(':memory:');
		const { budget } = createBudgetWithUser(db);
		const account = seedAccount(db, budget.id, 'Checking');
		const cat = seedCategory(db, budget.id, 'Savings');

		seedAssignment(db, budget.id, cat.id, prevMonth, 10000); // Dec
		seedAssignment(db, budget.id, cat.id, month, 20000); // Jan
		seedTransaction(db, budget.id, account.id, cat.id, '2024-12-20', -5000); // Dec
		seedTransaction(db, budget.id, account.id, cat.id, '2025-01-05', -3000); // Jan

		const bal = categoryBalances(db, month);
		const [row] = db.select().from(bal).where(eq(bal.categoryId, cat.id)).all();

		// month family: assigned = Jan only, activity = Jan only
		expect(row.assigned).toBe(20000);
		expect(row.activity).toBe(-3000);
		// remaining = on-or-before Jan = Dec + Jan
		expect(row.remaining).toBe(10000 + 20000 + -5000 + -3000); // 22000
		// all-time family
		expect(row.allTimeRemaining).toBe(10000 + 20000 + -5000 + -3000); // same, all entries are past
	});

	it('excludes future-dated transactions from month family, includes in all-time', () => {
		const db = createDatabase(':memory:');
		const { budget } = createBudgetWithUser(db);
		const account = seedAccount(db, budget.id, 'Checking');
		const cat = seedCategory(db, budget.id, 'Rent');

		seedTransaction(db, budget.id, account.id, cat.id, '2025-01-01', -50000); // Jan
		seedTransaction(db, budget.id, account.id, cat.id, '2025-03-15', -50000); // March (future)

		const bal = categoryBalances(db, month);
		const [row] = db.select().from(bal).where(eq(bal.categoryId, cat.id)).all();

		expect(row.activity).toBe(-50000); // only Jan
		expect(row.remaining).toBe(-50000); // only on-or-before Jan
		expect(row.allTimeRemaining).toBe(-100000); // both tx included
		expect(row.allTimeTransactionSum).toBe(-100000);
	});

	it('excludes future-month assignments from month family, includes in all-time', () => {
		const db = createDatabase(':memory:');
		const { budget } = createBudgetWithUser(db);
		const cat = seedCategory(db, budget.id, 'Goals');

		seedAssignment(db, budget.id, cat.id, month, 5000); // Jan
		seedAssignment(db, budget.id, cat.id, nextMonth, 8000); // Feb

		const bal = categoryBalances(db, month);
		const [row] = db.select().from(bal).where(eq(bal.categoryId, cat.id)).all();

		expect(row.assigned).toBe(5000); // only Jan
		expect(row.remaining).toBe(5000); // on-or-before Jan
		expect(row.allTimeRemaining).toBe(13000); // both included
		expect(row.allTimeAssignmentSum).toBe(13000);
	});

	it('pendingCount counts unvalidated transactions all-time', () => {
		const db = createDatabase(':memory:');
		const { budget } = createBudgetWithUser(db);
		const account = seedAccount(db, budget.id, 'Checking');
		const cat = seedCategory(db, budget.id, 'PendingStuff');

		seedTransaction(db, budget.id, account.id, cat.id, '2025-01-10', -1000, true); // validated
		seedTransaction(db, budget.id, account.id, cat.id, '2025-03-01', -2000, false); // pending, future
		seedTransaction(db, budget.id, account.id, cat.id, '2025-01-20', -500, false); // pending, current

		const bal = categoryBalances(db, month);
		const [row] = db.select().from(bal).where(eq(bal.categoryId, cat.id)).all();

		expect(row.pendingCount).toBe(2); // both unvalidated
		expect(row.txCount).toBe(3); // all three
	});

	it('excludes income (null categoryId) from per-category aggregates', () => {
		const db = createDatabase(':memory:');
		const { budget } = createBudgetWithUser(db);
		const account = seedAccount(db, budget.id, 'Checking');
		const cat = seedCategory(db, budget.id, 'Groceries');

		seedTransaction(db, budget.id, account.id, cat.id, '2025-01-10', -5000); // categorized
		seedTransaction(db, budget.id, account.id, null, '2025-01-15', 100000); // income

		const bal = categoryBalances(db, month);
		const [row] = db.select().from(bal).where(eq(bal.categoryId, cat.id)).all();

		expect(row.allTimeTransactionSum).toBe(-5000); // only the categorized tx
		expect(row.txCount).toBe(1);
	});

	it('returns no row for a category with no transactions or assignments', () => {
		const db = createDatabase(':memory:');
		const { budget } = createBudgetWithUser(db);
		const cat = seedCategory(db, budget.id, 'Empty');

		// categoryBalances is built from a union of tx/assignment categoryIds,
		// so a category with neither does not appear in the subquery.
		// The caller LEFT JOINs against categories and coalesces to 0.
		const bal = categoryBalances(db, month);
		const [row] = db.select().from(bal).where(eq(bal.categoryId, cat.id)).all();

		expect(row).toBeUndefined(); // not in the envelope — caller handles via LEFT JOIN + COALESCE
	});

	it('distinguishes allTimeRemaining from remaining when entries span the cutoff', () => {
		const db = createDatabase(':memory:');
		const { budget } = createBudgetWithUser(db);
		const account = seedAccount(db, budget.id, 'Checking');
		const cat = seedCategory(db, budget.id, 'Hybrid');

		seedAssignment(db, budget.id, cat.id, prevMonth, 10000); // before month
		seedAssignment(db, budget.id, cat.id, month, 15000); // in month
		seedAssignment(db, budget.id, cat.id, nextMonth, 20000); // after month
		seedTransaction(db, budget.id, account.id, cat.id, '2024-12-10', -4000); // before
		seedTransaction(db, budget.id, account.id, cat.id, '2025-01-05', -6000); // in
		seedTransaction(db, budget.id, account.id, cat.id, '2025-02-20', -5000); // after

		const bal = categoryBalances(db, month);
		const [row] = db.select().from(bal).where(eq(bal.categoryId, cat.id)).all();

		// month family scoped to on-or-before Jan
		expect(row.assigned).toBe(15000); // Jan only
		expect(row.activity).toBe(-6000); // Jan only
		expect(row.remaining).toBe(10000 + 15000 + -4000 + -6000); // Dec + Jan = 15000
		// all-time family: everything
		expect(row.allTimeRemaining).toBe(10000 + 15000 + 20000 + -4000 + -6000 + -5000); // 30000
	});
});

describe('unassigned', () => {
	it('returns income minus all assignments, budget-lifetime', () => {
		const db = createDatabase(':memory:');
		const { budget } = createBudgetWithUser(db);
		const account = seedAccount(db, budget.id, 'Checking');
		const cat = seedCategory(db, budget.id, 'Groceries');
		const jan = parseMonth(202501)!;
		const feb = parseMonth(202502)!;

		seedTransaction(db, budget.id, account.id, null, '2025-01-10', 100000); // income
		seedTransaction(db, budget.id, account.id, null, '2025-01-15', 50000); // more income
		seedTransaction(db, budget.id, account.id, cat.id, '2025-01-20', -30000); // categorized (not income)
		seedAssignment(db, budget.id, cat.id, jan, 20000);
		seedAssignment(db, budget.id, cat.id, feb, 10000); // future month, still included

		expect(unassigned(db, budget.id)).toBe(100000 + 50000 - 20000 - 10000); // 120000
	});

	it('returns zero when there is no income and no assignments', () => {
		const db = createDatabase(':memory:');
		const { budget } = createBudgetWithUser(db);

		expect(unassigned(db, budget.id)).toBe(0);
	});

	it('returns negative when assignments exceed income', () => {
		const db = createDatabase(':memory:');
		const { budget } = createBudgetWithUser(db);
		const cat = seedCategory(db, budget.id, 'Overassigned');
		const jan = parseMonth(202501)!;

		seedTransaction(
			db,
			budget.id,
			seedAccount(db, budget.id, 'Checking').id,
			null,
			'2025-01-01',
			10000
		);
		seedAssignment(db, budget.id, cat.id, jan, 30000);

		expect(unassigned(db, budget.id)).toBe(-20000);
	});

	it('includes future-dated income and future-month assignments (all-time quirk, #44)', () => {
		const db = createDatabase(':memory:');
		const { budget } = createBudgetWithUser(db);
		const account = seedAccount(db, budget.id, 'Checking');
		const cat = seedCategory(db, budget.id, 'Future');
		const futureMonth = parseMonth(202512)!;

		seedTransaction(db, budget.id, account.id, null, '2025-12-01', 50000); // future income
		seedAssignment(db, budget.id, cat.id, futureMonth, 50000); // future assignment

		// #44 tracks that future income should not count — but behaviour is
		// preserved as-is behind the seam so it can be changed locally later.
		expect(unassigned(db, budget.id)).toBe(0); // 50000 - 50000
	});
});
