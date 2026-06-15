import { createDatabase, tables } from '$db';
import { NotFoundError } from '$server/utils/not-found-error';
import { and, eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { createBudgetWithUser, createUser } from '../../../../test/fixtures';
import { commands, queries } from './account';

describe('queries.all', () => {
	it('returns accounts with balance for OWNER', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { all } = queries(user.id, db);

		const a = db
			.insert(tables.accounts)
			.values({ budgetId: budget.id, name: 'Account A' })
			.returning()
			.get();

		const result = all();
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({ balance: 0, id: a.id, name: 'Account A' });
	});

	it('all(budgetId) filters by budget', () => {
		const db = createDatabase(':memory:');
		const { budget: b1, user } = createBudgetWithUser(db, 'OWNER', 'user1');
		const b2 = db.insert(tables.budgets).values({ name: 'Budget 2' }).returning().get();
		db.insert(tables.usersToBudgets)
			.values({ budgetId: b2.id, role: 'OWNER', userId: user.id })
			.run();

		db.insert(tables.accounts).values({ budgetId: b1.id, name: 'A1' }).run();
		db.insert(tables.accounts).values({ budgetId: b2.id, name: 'A2' }).run();

		const { all } = queries(user.id, db);
		const result = all(b1.id);
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe('A1');
	});

	it('returns empty for INVITEE', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db, 'INVITEE');
		const { all } = queries(user.id, db);

		db.insert(tables.accounts).values({ budgetId: budget.id, name: 'A' }).run();

		expect(all()).toHaveLength(0);
	});

	it('includes balance from transactions', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { all } = queries(user.id, db);

		const a = db
			.insert(tables.accounts)
			.values({ budgetId: budget.id, name: 'A' })
			.returning()
			.get();
		db.insert(tables.transactions)
			.values({ accountId: a.id, amount: 100, budgetId: budget.id, date: '2025-01-01' })
			.run();
		db.insert(tables.transactions)
			.values({ accountId: a.id, amount: -50, budgetId: budget.id, date: '2025-01-02' })
			.run();

		const result = all();
		expect(result[0].balance).toBe(50);
	});
});

describe('queries.balances', () => {
	it('returns pending and validated amounts', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { balances } = queries(user.id, db);

		const a = db
			.insert(tables.accounts)
			.values({ budgetId: budget.id, name: 'A' })
			.returning()
			.get();
		db.insert(tables.transactions)
			.values({
				accountId: a.id,
				amount: 100,
				budgetId: budget.id,
				date: '2025-01-01',
				validated: true
			})
			.run();
		db.insert(tables.transactions)
			.values({
				accountId: a.id,
				amount: 50,
				budgetId: budget.id,
				date: '2025-01-02',
				validated: false
			})
			.run();

		const result = balances(a.id);
		expect(result).toMatchObject({ pending: 50, validated: 100 });
	});

	it('throws for non-existent account', () => {
		const db = createDatabase(':memory:');
		const { user } = createBudgetWithUser(db);
		const { balances } = queries(user.id, db);

		expect(() => balances('nonexistent')).toThrow();
	});
});

describe('queries.byId', () => {
	it('returns account with properties', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { byId } = queries(user.id, db);

		const a = db
			.insert(tables.accounts)
			.values({ budgetId: budget.id, name: 'My Account', notes: 'Some notes' })
			.returning()
			.get();

		const result = byId(a.id);
		expect(result).toMatchObject({ balance: 0, id: a.id, name: 'My Account', notes: 'Some notes' });
	});

	it('throws for non-existent account', () => {
		const db = createDatabase(':memory:');
		const { user } = createBudgetWithUser(db);
		const { byId } = queries(user.id, db);

		expect(() => byId('nonexistent')).toThrow();
	});

	it('throws when user has no access', () => {
		const db = createDatabase(':memory:');
		const { budget } = createBudgetWithUser(db, 'OWNER', 'owner');
		const outsider = createUser(db, 'outsider');

		const a = db
			.insert(tables.accounts)
			.values({ budgetId: budget.id, name: 'A' })
			.returning()
			.get();
		const { byId } = queries(outsider.id, db);

		expect(() => byId(a.id)).toThrow();
	});
});

describe('commands.create', () => {
	it('creates account and userEntityOrder', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create } = commands(user.id, db);

		const account = create({ budgetId: budget.id, name: 'New Account', notes: null });

		expect(account).toMatchObject({ budgetId: budget.id, name: 'New Account' });
		expect(account.id).toBeDefined();

		const order = db
			.select()
			.from(tables.userEntityOrder)
			.where(
				and(
					eq(tables.userEntityOrder.entityId, account.id),
					eq(tables.userEntityOrder.entityType, 'account')
				)
			)
			.all();
		expect(order).toHaveLength(1);
		expect(order[0].position).toBe(0);
	});

	it('with startingBalance creates validated transaction', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create } = commands(user.id, db);

		const account = create({ budgetId: budget.id, name: 'Savings', notes: null }, 500);

		const tx = db
			.select()
			.from(tables.transactions)
			.where(eq(tables.transactions.accountId, account.id))
			.all();
		expect(tx).toHaveLength(1);
		expect(tx[0]).toMatchObject({ amount: 500, validated: true });
	});

	it('startingBalance 0 creates no transaction', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create } = commands(user.id, db);

		const account = create({ budgetId: budget.id, name: 'Empty', notes: null }, 0);

		const tx = db
			.select()
			.from(tables.transactions)
			.where(eq(tables.transactions.accountId, account.id))
			.all();
		expect(tx).toHaveLength(0);
	});

	it('throws NotFoundError without budget access', () => {
		const db = createDatabase(':memory:');
		const { budget } = createBudgetWithUser(db, 'OWNER', 'owner');
		const outsider = createUser(db, 'outsider');
		const { create } = commands(outsider.id, db);

		expect(() => create({ budgetId: budget.id, name: 'Nope', notes: null })).toThrow(NotFoundError);
	});
});

describe('commands.edit', () => {
	it('updates account name', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create } = commands(user.id, db);
		const { edit } = commands(user.id, db);

		const a = create({ budgetId: budget.id, name: 'Old Name', notes: null });
		const updated = edit(a.id, 'New Name');

		expect(updated.name).toBe('New Name');
	});

	it('throws for non-existent account', () => {
		const db = createDatabase(':memory:');
		const { user } = createBudgetWithUser(db);
		const { edit } = commands(user.id, db);

		expect(() => edit('nonexistent', 'Name')).toThrow();
	});
});

describe('commands.reorder', () => {
	it('sets positions for given ids', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create, reorder } = commands(user.id, db);

		const a = create({ budgetId: budget.id, name: 'A', notes: null });
		const b = create({ budgetId: budget.id, name: 'B', notes: null });
		const c = create({ budgetId: budget.id, name: 'C', notes: null });

		reorder([c.id, a.id, b.id]);

		const order = db
			.select()
			.from(tables.userEntityOrder)
			.where(eq(tables.userEntityOrder.entityType, 'account'))
			.all();

		expect(order.find((o) => o.entityId === c.id)?.position).toBe(0);
		expect(order.find((o) => o.entityId === a.id)?.position).toBe(1);
		expect(order.find((o) => o.entityId === b.id)?.position).toBe(2);
	});
});
