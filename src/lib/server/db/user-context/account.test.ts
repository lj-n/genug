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

	it('throws 400 for duplicate name in the same budget', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create } = commands(user.id, db);

		create({ budgetId: budget.id, name: 'Checking', notes: null });

		let thrown;
		try {
			create({ budgetId: budget.id, name: 'Checking', notes: null });
		} catch (e) {
			thrown = e;
		}
		expect(thrown).toMatchObject({ status: 400 });
	});

	it('allows the same name in a different budget', () => {
		const db = createDatabase(':memory:');
		const { budget: b1, user } = createBudgetWithUser(db, 'OWNER', 'user1');
		const b2 = db.insert(tables.budgets).values({ name: 'Budget 2' }).returning().get();
		db.insert(tables.usersToBudgets)
			.values({ budgetId: b2.id, role: 'OWNER', userId: user.id })
			.run();
		const { create } = commands(user.id, db);

		create({ budgetId: b1.id, name: 'Checking', notes: null });
		const account = create({ budgetId: b2.id, name: 'Checking', notes: null });

		expect(account).toMatchObject({ budgetId: b2.id, name: 'Checking' });
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

	it('throws 400 when renaming to an existing name in the same budget', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create, edit } = commands(user.id, db);

		create({ budgetId: budget.id, name: 'Checking', notes: null });
		const a = create({ budgetId: budget.id, name: 'Savings', notes: null });

		let thrown;
		try {
			edit(a.id, 'Checking');
		} catch (e) {
			thrown = e;
		}
		expect(thrown).toMatchObject({ status: 400 });
	});

	it('allows saving with its own unchanged name', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create, edit } = commands(user.id, db);

		const a = create({ budgetId: budget.id, name: 'Checking', notes: null });

		const updated = edit(a.id, 'Checking');
		expect(updated.name).toBe('Checking');
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

describe('queries.all — archived split', () => {
	it('excludes archived accounts', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { all } = queries(user.id, db);

		db.insert(tables.accounts).values({ budgetId: budget.id, name: 'Active' }).run();
		db.insert(tables.accounts)
			.values({ archivedAt: new Date(), budgetId: budget.id, name: 'Archived' })
			.run();

		const result = all();
		expect(result).toHaveLength(1);
		expect(result[0].name).toBe('Active');
	});
});

describe('queries.archived', () => {
	it('returns only archived accounts', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { archived } = queries(user.id, db);

		db.insert(tables.accounts).values({ budgetId: budget.id, name: 'Active' }).run();
		const gone = db
			.insert(tables.accounts)
			.values({ archivedAt: new Date(), budgetId: budget.id, name: 'Archived' })
			.returning()
			.get();

		const result = archived(budget.id);
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({ id: gone.id, name: 'Archived' });
	});

	it('returns empty for INVITEE', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db, 'INVITEE');
		const { archived } = queries(user.id, db);

		db.insert(tables.accounts)
			.values({ archivedAt: new Date(), budgetId: budget.id, name: 'Archived' })
			.run();

		expect(archived(budget.id)).toHaveLength(0);
	});
});

describe('queries.archivability', () => {
	it('is archivable with zero balance and no pending transactions', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create } = commands(user.id, db);
		const { archivability } = queries(user.id, db);

		const a = create({ budgetId: budget.id, name: 'Empty', notes: null });

		expect(archivability(a.id)).toEqual({
			archivable: true,
			balance: 0,
			pendingTransactionCount: 0
		});
	});

	it('is archivable when validated transactions cancel out', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create } = commands(user.id, db);
		const { archivability } = queries(user.id, db);

		const a = create({ budgetId: budget.id, name: 'Balanced', notes: null });
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
				amount: -100,
				budgetId: budget.id,
				date: '2025-01-02',
				validated: true
			})
			.run();

		expect(archivability(a.id)).toEqual({
			archivable: true,
			balance: 0,
			pendingTransactionCount: 0
		});
	});

	it('is not archivable with a remaining balance', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create } = commands(user.id, db);
		const { archivability } = queries(user.id, db);

		const a = create({ budgetId: budget.id, name: 'Funded', notes: null });
		db.insert(tables.transactions)
			.values({
				accountId: a.id,
				amount: 200,
				budgetId: budget.id,
				date: '2025-01-01',
				validated: true
			})
			.run();

		expect(archivability(a.id)).toEqual({
			archivable: false,
			balance: 200,
			pendingTransactionCount: 0
		});
	});

	it('is not archivable with a pending transaction even when the balance nets to zero', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create } = commands(user.id, db);
		const { archivability } = queries(user.id, db);

		const a = create({ budgetId: budget.id, name: 'Pending', notes: null });
		db.insert(tables.transactions)
			.values({
				accountId: a.id,
				amount: -50,
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

		expect(archivability(a.id)).toEqual({
			archivable: false,
			balance: 0,
			pendingTransactionCount: 1
		});
	});

	it('throws for account without access', () => {
		const db = createDatabase(':memory:');
		const { budget, user: owner } = createBudgetWithUser(db, 'OWNER', 'owner');
		const { create } = commands(owner.id, db);
		const a = create({ budgetId: budget.id, name: 'Hidden', notes: null });

		const outsider = createUser(db, 'outsider');
		const { archivability } = queries(outsider.id, db);

		expect(() => archivability(a.id)).toThrow();
	});
});

describe('queries.deletability', () => {
	it('is deletable with no transactions', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create } = commands(user.id, db);
		const { deletability } = queries(user.id, db);

		const a = create({ budgetId: budget.id, name: 'Empty', notes: null });

		expect(deletability(a.id)).toEqual({
			deletable: true,
			transactionCount: 0
		});
	});

	it('is not deletable with validated transactions that net to zero (unlike archivable)', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create } = commands(user.id, db);
		const { archivability, deletability } = queries(user.id, db);

		const a = create({ budgetId: budget.id, name: 'Spent', notes: null });
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
				amount: -100,
				budgetId: budget.id,
				date: '2025-01-02',
				validated: true
			})
			.run();

		// Balance nets to zero with no pending, so it is archivable — but the
		// validated transactions still make it non-deletable
		// (Deletable ⟹ Archivable, never the reverse).
		expect(archivability(a.id).archivable).toBe(true);
		expect(deletability(a.id)).toEqual({
			deletable: false,
			transactionCount: 2
		});
	});

	it('is not deletable with a pending transaction', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create } = commands(user.id, db);
		const { deletability } = queries(user.id, db);

		const a = create({ budgetId: budget.id, name: 'Pending', notes: null });
		db.insert(tables.transactions)
			.values({
				accountId: a.id,
				amount: 30,
				budgetId: budget.id,
				date: '2025-01-01',
				validated: false
			})
			.run();

		expect(deletability(a.id)).toEqual({
			deletable: false,
			transactionCount: 1
		});
	});

	it('reports the total transaction count', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create } = commands(user.id, db);
		const { deletability } = queries(user.id, db);

		const a = create({ budgetId: budget.id, name: 'Mixed', notes: null });
		db.insert(tables.transactions)
			.values({
				accountId: a.id,
				amount: 30,
				budgetId: budget.id,
				date: '2025-01-01',
				validated: true
			})
			.run();
		db.insert(tables.transactions)
			.values({
				accountId: a.id,
				amount: 20,
				budgetId: budget.id,
				date: '2025-02-01',
				validated: false
			})
			.run();

		expect(deletability(a.id)).toEqual({
			deletable: false,
			transactionCount: 2
		});
	});

	it('throws for account without access', () => {
		const db = createDatabase(':memory:');
		const { budget, user: owner } = createBudgetWithUser(db, 'OWNER', 'owner');
		const { create } = commands(owner.id, db);
		const a = create({ budgetId: budget.id, name: 'Hidden', notes: null });

		const outsider = createUser(db, 'outsider');
		const { deletability } = queries(outsider.id, db);

		expect(() => deletability(a.id)).toThrow();
	});
});

describe('commands.archive', () => {
	it('sets archivedAt when archivable', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { archive, create } = commands(user.id, db);

		const a = create({ budgetId: budget.id, name: 'Done', notes: null });

		const archived = archive(a.id);
		expect(archived.archivedAt).toBeInstanceOf(Date);
	});

	it('throws 400 and leaves account untouched when a balance remains', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { archive, create } = commands(user.id, db);
		const { byId } = queries(user.id, db);

		const a = create({ budgetId: budget.id, name: 'Funded', notes: null });
		db.insert(tables.transactions)
			.values({
				accountId: a.id,
				amount: 100,
				budgetId: budget.id,
				date: '2025-01-01',
				validated: true
			})
			.run();

		let thrown;
		try {
			archive(a.id);
		} catch (e) {
			thrown = e;
		}
		expect(thrown).toMatchObject({ status: 400 });
		expect(byId(a.id).id).toBe(a.id);
	});

	it('throws 400 when a pending transaction exists', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { archive, create } = commands(user.id, db);

		const a = create({ budgetId: budget.id, name: 'Pending', notes: null });
		db.insert(tables.transactions)
			.values({
				accountId: a.id,
				amount: -50,
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

		let thrown;
		try {
			archive(a.id);
		} catch (e) {
			thrown = e;
		}
		expect(thrown).toMatchObject({ status: 400 });
	});

	it('throws for account without access', () => {
		const db = createDatabase(':memory:');
		const { budget, user: owner } = createBudgetWithUser(db, 'OWNER', 'owner');
		const { create } = commands(owner.id, db);
		const a = create({ budgetId: budget.id, name: 'Hidden', notes: null });

		const outsider = createUser(db, 'outsider');
		const { archive } = commands(outsider.id, db);

		expect(() => archive(a.id)).toThrow();
	});
});

describe('commands.restore', () => {
	it('clears archivedAt', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { archive, create, restore } = commands(user.id, db);

		const a = create({ budgetId: budget.id, name: 'Back', notes: null });
		archive(a.id);

		const restored = restore(a.id);
		expect(restored.archivedAt).toBeNull();
	});

	it('throws for non-existent account', () => {
		const db = createDatabase(':memory:');
		const { user } = createBudgetWithUser(db);
		const { restore } = commands(user.id, db);

		expect(() => restore('nonexistent')).toThrow();
	});
});

describe('commands.delete', () => {
	it('removes the account and its user_entity_order rows', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create, delete: deleteAccount } = commands(user.id, db);

		const a = create({ budgetId: budget.id, name: 'Gone', notes: null });

		deleteAccount(a.id);

		const account = db.select().from(tables.accounts).where(eq(tables.accounts.id, a.id)).get();
		expect(account).toBeUndefined();

		const order = db
			.select()
			.from(tables.userEntityOrder)
			.where(eq(tables.userEntityOrder.entityId, a.id))
			.all();
		expect(order).toHaveLength(0);
	});

	it('throws 400 and leaves the account intact when a transaction exists', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create, delete: deleteAccount } = commands(user.id, db);
		const { byId } = queries(user.id, db);

		const a = create({ budgetId: budget.id, name: 'Used', notes: null });
		db.insert(tables.transactions)
			.values({
				accountId: a.id,
				amount: -50,
				budgetId: budget.id,
				date: '2025-01-01',
				validated: true
			})
			.run();

		let thrown;
		try {
			deleteAccount(a.id);
		} catch (e) {
			thrown = e;
		}
		expect(thrown).toMatchObject({ status: 400 });
		expect(byId(a.id).id).toBe(a.id);
	});

	it('is deletable only after the starting-balance transaction is removed', () => {
		const db = createDatabase(':memory:');
		const { budget, user } = createBudgetWithUser(db);
		const { create, delete: deleteAccount } = commands(user.id, db);
		const { deletability } = queries(user.id, db);

		// An account created with a starting balance carries a validated
		// income transaction, so it is not immediately deletable (see ADR-0011).
		const a = create({ budgetId: budget.id, name: 'Typo', notes: null }, 500);
		expect(deletability(a.id).deletable).toBe(false);
		expect(() => deleteAccount(a.id)).toThrow();

		db.delete(tables.transactions).where(eq(tables.transactions.accountId, a.id)).run();

		expect(deletability(a.id).deletable).toBe(true);
		deleteAccount(a.id);
		expect(
			db.select().from(tables.accounts).where(eq(tables.accounts.id, a.id)).get()
		).toBeUndefined();
	});

	it('throws for account without access', () => {
		const db = createDatabase(':memory:');
		const { budget, user: owner } = createBudgetWithUser(db, 'OWNER', 'owner');
		const { create } = commands(owner.id, db);
		const a = create({ budgetId: budget.id, name: 'Hidden', notes: null });

		const outsider = createUser(db, 'outsider');
		const { delete: deleteAccount } = commands(outsider.id, db);

		expect(() => deleteAccount(a.id)).toThrow();
	});
});
