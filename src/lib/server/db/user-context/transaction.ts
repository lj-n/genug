import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';

import { database, type Database, tables } from '$db';
import { TRANSFER, UNASSIGNED } from '$lib/constants';
import { m } from '$lib/paraglide/messages';
import { createId } from '$server/utils/create-id';
import { getLocalTimeZone, today } from '@internationalized/date';
import { error } from '@sveltejs/kit';
import {
	and,
	asc,
	count,
	desc,
	eq,
	getColumns,
	inArray,
	isNotNull,
	isNull,
	ne,
	or,
	type SQL,
	sql
} from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';

import { accessGuard, hasAccess } from './access';

export type TransactionFilterParam = {
	accountId?: string;
	categoryId?: string[];
	notes?: string;
};

export type TransactionSortParam = {
	account?: SortParam;
	amount?: SortParam;
	category?: SortParam;
	date?: SortParam;
	validated?: SortParam;
};

type SortParam = 'asc' | 'desc';

export const queries = (userId: string, db: Database = database) => ({
	byId: (id: string) => {
		const { counterpart, counterpartAccount, counterpartColumns, counterpartJoin } =
			counterpartAccountJoin();

		const found = db
			.select({ ...getColumns(tables.transactions), ...counterpartColumns })
			.from(tables.transactions)
			.leftJoin(counterpart, counterpartJoin)
			.leftJoin(counterpartAccount, eq(counterpart.accountId, counterpartAccount.id))
			.where(and(hasAccess(tables.transactions, userId, db), eq(tables.transactions.id, id)))
			.get();

		if (!found) error(404);
		return found;
	},

	page: (
		filter: TransactionFilterParam,
		sort: TransactionSortParam,
		pagination: { page: number; pageSize: number }
	) => {
		const where = and(hasAccess(tables.transactions, userId, db), ...filterConditions(filter));
		const { counterpart, counterpartAccount, counterpartColumns, counterpartJoin } =
			counterpartAccountJoin();

		const rows = db
			.select({
				...getColumns(tables.transactions),
				...counterpartColumns,
				categoryName: tables.categories.name,
				createdByName: tables.users.username
			})
			.from(tables.transactions)
			.leftJoin(tables.categories, eq(tables.transactions.categoryId, tables.categories.id))
			.leftJoin(tables.users, eq(tables.transactions.createdBy, tables.users.id))
			.leftJoin(counterpart, counterpartJoin)
			.leftJoin(counterpartAccount, eq(counterpart.accountId, counterpartAccount.id))
			.where(where)
			.orderBy(...sortOrder(sort))
			.limit(pagination.pageSize)
			.offset(pagination.page * pagination.pageSize)
			.all();

		const total =
			db.select({ total: count() }).from(tables.transactions).where(where).get()?.total ?? 0;

		return { rows, total };
	}
});

export type ListTransaction = ReturnType<ReturnType<typeof queries>['page']>['rows'][number];

// A transfer leg's register row shows the account on the other side of the
// pair (ADR-0015); ordinary transactions get NULLs since a NULL transferId
// never joins.
function counterpartAccountJoin() {
	const counterpart = alias(tables.transactions, 'counterpart');
	const counterpartAccount = alias(tables.accounts, 'counterpart_account');

	return {
		counterpart,
		counterpartAccount,
		counterpartColumns: {
			counterpartAccountId: counterpart.accountId,
			counterpartAccountName: counterpartAccount.name
		},
		counterpartJoin: and(
			eq(counterpart.transferId, tables.transactions.transferId),
			ne(counterpart.id, tables.transactions.id)
		)
	};
}

export const commands = (userId: string, db: Database = database) => ({
	create: (data: Omit<typeof tables.transactions.$inferInsert, 'date'> & { date?: string }) => {
		accessGuard(data.budgetId, userId, db);
		activeAccountGuard(db, data.budgetId, data.accountId);

		return db.transaction((tx) => {
			return tx
				.insert(tables.transactions)
				.values({ ...data, date: data.date ?? today(getLocalTimeZone()).toString() })
				.returning()
				.get();
		});
	},

	delete: (ids: string[]) => {
		// Deleting a transfer leg has exactly one legal meaning — the whole
		// transfer goes — so the selection expands to counterpart legs
		// (ADR-0015). A single DELETE keeps the pair removal atomic.
		const selectedTransferIds = db
			.select({ transferId: tables.transactions.transferId })
			.from(tables.transactions)
			.where(
				and(
					hasAccess(tables.transactions, userId, db),
					inArray(tables.transactions.id, ids),
					isNotNull(tables.transactions.transferId)
				)
			);

		return db
			.delete(tables.transactions)
			.where(
				and(
					hasAccess(tables.transactions, userId, db),
					or(
						inArray(tables.transactions.id, ids),
						inArray(tables.transactions.transferId, selectedTransferIds)
					)
				)
			)
			.returning()
			.all();
	},

	edit: (id: string, update: Partial<typeof tables.transactions.$inferInsert>) => {
		const existing = db
			.select({ transferId: tables.transactions.transferId })
			.from(tables.transactions)
			.where(and(hasAccess(tables.transactions, userId, db), eq(tables.transactions.id, id)))
			.get();

		if (!existing) error(404);
		// Editing a single leg is ambiguous — transfers change through
		// editTransfer, which keeps both legs consistent (ADR-0015).
		if (existing.transferId)
			error(400, {
				code: 'transaction_is_transfer_leg',
				message: m.error_transaction_is_transfer_leg()
			});

		const data = { ...update, validated: update.validated ?? false };
		const updated = db
			.update(tables.transactions)
			.set(data)
			.where(and(hasAccess(tables.transactions, userId, db), eq(tables.transactions.id, id)))
			.returning()
			.get();

		if (!updated) error(404);
		return updated;
	},

	editTransfer: (
		transferId: string,
		update: {
			amount?: number;
			date?: string;
			fromAccountId?: string;
			notes?: null | string;
			toAccountId?: string;
		}
	) => {
		const legs = db
			.select(getColumns(tables.transactions))
			.from(tables.transactions)
			.where(
				and(
					hasAccess(tables.transactions, userId, db),
					eq(tables.transactions.transferId, transferId)
				)
			)
			.all();

		const currentFrom = legs.find((leg) => leg.amount < 0);
		const currentTo = legs.find((leg) => leg.amount >= 0);
		if (legs.length !== 2 || !currentFrom || !currentTo) error(404);

		if (update.amount !== undefined && update.amount <= 0) {
			error(400, m.error_transfer_amount_positive());
		}

		const fromAccountId = update.fromAccountId ?? currentFrom.accountId;
		const toAccountId = update.toAccountId ?? currentTo.accountId;
		if (fromAccountId === toAccountId) error(400, m.error_transfer_same_account());

		if (update.fromAccountId && update.fromAccountId !== currentFrom.accountId) {
			activeAccountGuard(db, currentFrom.budgetId, update.fromAccountId);
		}
		if (update.toAccountId && update.toAccountId !== currentTo.accountId) {
			activeAccountGuard(db, currentTo.budgetId, update.toAccountId);
		}

		// `validated` is deliberately untouched: each leg reconciles against its
		// own account statement, and validation is purely user-controlled.
		const shared = {
			...(update.date !== undefined ? { date: update.date } : {}),
			...(update.notes !== undefined ? { notes: update.notes } : {})
		};

		return db.transaction((tx) => {
			const from = tx
				.update(tables.transactions)
				.set({
					...shared,
					accountId: fromAccountId,
					...(update.amount !== undefined ? { amount: -update.amount } : {})
				})
				.where(eq(tables.transactions.id, currentFrom.id))
				.returning()
				.get();

			const to = tx
				.update(tables.transactions)
				.set({
					...shared,
					accountId: toAccountId,
					...(update.amount !== undefined ? { amount: update.amount } : {})
				})
				.where(eq(tables.transactions.id, currentTo.id))
				.returning()
				.get();

			return { from, to };
		});
	},

	transfer: ({
		amount,
		budgetId,
		date,
		fromAccountId,
		notes,
		toAccountId
	}: {
		amount: number;
		budgetId: string;
		date?: string;
		fromAccountId: string;
		notes?: null | string;
		toAccountId: string;
	}) => {
		accessGuard(budgetId, userId, db);

		if (amount <= 0) error(400, m.error_transfer_amount_positive());
		if (fromAccountId === toAccountId) error(400, m.error_transfer_same_account());
		activeAccountGuard(db, budgetId, fromAccountId);
		activeAccountGuard(db, budgetId, toAccountId);

		const shared = {
			budgetId,
			categoryId: null,
			createdBy: userId,
			date: date ?? today(getLocalTimeZone()).toString(),
			notes: notes ?? null,
			transferId: createId()
		};

		return db.transaction((tx) => {
			const from = tx
				.insert(tables.transactions)
				.values({ ...shared, accountId: fromAccountId, amount: -amount })
				.returning()
				.get();

			const to = tx
				.insert(tables.transactions)
				.values({ ...shared, accountId: toAccountId, amount })
				.returning()
				.get();

			return { from, to };
		});
	},

	validate: (ids: string[], validated: boolean) => {
		return db
			.update(tables.transactions)
			.set({ validated })
			.where(and(inArray(tables.transactions.id, ids), hasAccess(tables.transactions, userId, db)))
			.returning()
			.all();
	}
});

// An archived account is inert: reject new transactions server-side so a
// stale tab or back-navigation can never write to it (see ADR-0011).
function activeAccountGuard(db: Database, budgetId: string, accountId: string) {
	const account = db
		.select({ archivedAt: tables.accounts.archivedAt })
		.from(tables.accounts)
		.where(and(eq(tables.accounts.id, accountId), eq(tables.accounts.budgetId, budgetId)))
		.get();
	if (!account) error(404, m.error_account_not_found());
	if (account.archivedAt)
		error(400, { code: 'account_archived', message: m.error_account_archived() });
}

function escapeLikePattern(term: string) {
	return term.replace(/[\\%_]/g, '\\$&');
}

function filterConditions(filter: TransactionFilterParam) {
	const conditions: (SQL | undefined)[] = [];

	if (filter.accountId) {
		conditions.push(eq(tables.transactions.accountId, filter.accountId));
	}
	if (filter.categoryId) {
		const ids = filter.categoryId;
		const realIds = ids.filter((id: string) => id !== UNASSIGNED && id !== TRANSFER);

		const categoryConditions: SQL[] = [];
		if (realIds.length > 0)
			categoryConditions.push(inArray(tables.transactions.categoryId, realIds));
		// UNASSIGNED means income — transfer legs are category-free too, but
		// they are budget-neutral and get their own sentinel (ADR-0015).
		if (ids.includes(UNASSIGNED))
			categoryConditions.push(
				and(isNull(tables.transactions.categoryId), isNull(tables.transactions.transferId))!
			);
		if (ids.includes(TRANSFER)) categoryConditions.push(isNotNull(tables.transactions.transferId));

		conditions.push(
			categoryConditions.length === 1 ? categoryConditions[0] : or(...categoryConditions)
		);
	}
	if (filter.notes) {
		// SQLite's LIKE has no default escape character; ESCAPE makes \-escaped % and _ literal.
		const pattern = `%${escapeLikePattern(filter.notes)}%`;
		conditions.push(sql`${tables.transactions.notes} LIKE ${pattern} ESCAPE '\\'`);
	}

	return conditions;
}

function sortDirection(direction: SortParam, column: SQLiteColumn) {
	return direction === 'asc' ? asc(column) : desc(column);
}

function sortOrder(sort: TransactionSortParam) {
	const order: SQL[] = [];

	if (sort.date) {
		order.push(sortDirection(sort.date, tables.transactions.date));
	}
	if (sort.validated) {
		order.push(sortDirection(sort.validated, tables.transactions.validated));
	}
	if (sort.account) {
		order.push(sortDirection(sort.account, tables.transactions.accountId));
	}
	if (sort.category) {
		order.push(sortDirection(sort.category, tables.transactions.categoryId));
	}
	if (sort.amount) {
		order.push(sortDirection(sort.amount, tables.transactions.amount));
	}

	order.push(desc(tables.transactions.createdAt));

	return order;
}
