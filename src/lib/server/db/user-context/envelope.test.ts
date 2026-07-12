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
	const jan = parseMonth(202501)!;
	const feb = parseMonth(202502)!;
	const mar = parseMonth(202503)!;

	it('returns income up to the month minus assignments up to the month', () => {
		const db = createDatabase(':memory:');
		const { budget } = createBudgetWithUser(db);
		const account = seedAccount(db, budget.id, 'Checking');
		const cat = seedCategory(db, budget.id, 'Groceries');

		seedTransaction(db, budget.id, account.id, null, '2025-01-10', 100000); // income
		seedTransaction(db, budget.id, account.id, null, '2025-01-15', 50000); // more income
		seedTransaction(db, budget.id, account.id, cat.id, '2025-01-20', -30000); // categorized (not income)
		seedAssignment(db, budget.id, cat.id, jan, 20000);

		expect(unassigned(db, budget.id, jan)).toBe(100000 + 50000 - 20000); // 130000
	});

	it('returns zero when there is no income and no assignments', () => {
		const db = createDatabase(':memory:');
		const { budget } = createBudgetWithUser(db);

		expect(unassigned(db, budget.id, jan)).toBe(0);
	});

	it('returns negative when assignments in the month exceed income', () => {
		const db = createDatabase(':memory:');
		const { budget } = createBudgetWithUser(db);
		const cat = seedCategory(db, budget.id, 'Overassigned');

		seedTransaction(
			db,
			budget.id,
			seedAccount(db, budget.id, 'Checking').id,
			null,
			'2025-01-01',
			10000
		);
		seedAssignment(db, budget.id, cat.id, jan, 30000);

		expect(unassigned(db, budget.id, jan)).toBe(-20000);
	});

	it('is zero on a fully-assigned past month even when later months are also fully assigned', () => {
		const db = createDatabase(':memory:');
		const { budget } = createBudgetWithUser(db);
		const account = seedAccount(db, budget.id, 'Checking');
		const cat = seedCategory(db, budget.id, 'Groceries');

		// Jan: 100000 income, fully assigned.
		seedTransaction(db, budget.id, account.id, null, '2025-01-10', 100000);
		seedAssignment(db, budget.id, cat.id, jan, 100000);
		// Feb: 100000 income, fully assigned.
		seedTransaction(db, budget.id, account.id, null, '2025-02-10', 100000);
		seedAssignment(db, budget.id, cat.id, feb, 100000);

		// Viewing Jan: Feb's assignment is fully covered by Feb's income, so it
		// reaches back nothing. 100000 - 100000 - max(0, 100000 - 100000) = 0.
		expect(unassigned(db, budget.id, jan)).toBe(0);
	});

	it('reaches back an uncovered future assignment into the present month', () => {
		const db = createDatabase(':memory:');
		const { budget } = createBudgetWithUser(db);
		const account = seedAccount(db, budget.id, 'Checking');
		const cat = seedCategory(db, budget.id, 'Groceries');

		// Jan: 100000 income, nothing assigned yet.
		seedTransaction(db, budget.id, account.id, null, '2025-01-10', 100000);
		// Feb: 50000 assigned, but no Feb income to cover it.
		seedAssignment(db, budget.id, cat.id, feb, 50000);

		// Viewing Jan: 100000 - 0 - max(0, 50000 - 0) = 50000.
		expect(unassigned(db, budget.id, jan)).toBe(50000);
	});

	it('only reaches back the portion of future assignments not covered by future income', () => {
		const db = createDatabase(':memory:');
		const { budget } = createBudgetWithUser(db);
		const account = seedAccount(db, budget.id, 'Checking');
		const cat = seedCategory(db, budget.id, 'Groceries');

		seedTransaction(db, budget.id, account.id, null, '2025-01-10', 100000); // Jan income
		seedTransaction(db, budget.id, account.id, null, '2025-02-10', 30000); // Feb income
		seedAssignment(db, budget.id, cat.id, feb, 50000); // Feb assignment
		seedAssignment(db, budget.id, cat.id, mar, 10000); // Mar assignment

		// Viewing Jan: assignments after = 60000, income after = 30000.
		// 100000 - 0 - max(0, 60000 - 30000) = 70000.
		expect(unassigned(db, budget.id, jan)).toBe(70000);
	});

	it('excludes income dated in a later month', () => {
		const db = createDatabase(':memory:');
		const { budget } = createBudgetWithUser(db);
		const account = seedAccount(db, budget.id, 'Checking');

		seedTransaction(db, budget.id, account.id, null, '2025-01-10', 100000); // Jan income
		seedTransaction(db, budget.id, account.id, null, '2025-02-10', 40000); // Feb income

		// Viewing Jan: only Jan income counts, and Feb income covers no assignment.
		expect(unassigned(db, budget.id, jan)).toBe(100000);
	});

	it('counts month-granular income on the viewed month regardless of day', () => {
		const db = createDatabase(':memory:');
		const { budget } = createBudgetWithUser(db);
		const account = seedAccount(db, budget.id, 'Checking');

		// Salary dated late in January counts on the January page.
		seedTransaction(db, budget.id, account.id, null, '2025-01-25', 80000);

		expect(unassigned(db, budget.id, jan)).toBe(80000);
	});
});
