import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';

import { database, tables } from '$db';
import { redirect } from '@sveltejs/kit';
import { and, eq, exists, sql } from 'drizzle-orm';

import { Actions } from '.';

type EventWithLocals = {
	locals: App.Locals;
};

export function userHasPermission({
	budgetIdCol,
	database,
	userId
}: {
	budgetIdCol: SQLiteColumn;
	database: App.Database;
	userId: string;
}) {
	return exists(
		database
			.select({ one: sql`1` })
			.from(tables.usersToBudgets)
			.where(
				and(
					eq(tables.usersToBudgets.userId, userId),
					eq(tables.usersToBudgets.budgetId, budgetIdCol)
				)
			)
	);
}

export function withPermissions<TEvent extends EventWithLocals, TResult>(
	handler: (user: App.User, actions: App.Actions, event: TEvent) => TResult
): (event: TEvent) => Promise<Awaited<TResult>>;
export function withPermissions(
	handler: (user: App.User, actions: App.Actions, event: EventWithLocals) => unknown
) {
	return async (event: EventWithLocals) => {
		const session = event.locals.session;

		if (!session) {
			redirect(307, '/login');
		}

		return await handler(
			session.user,
			new Actions({
				database,
				user: session.user
			}),
			event
		);
	};
}
