import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';

import { database, tables } from '$db';
import { redirect, type RequestEvent } from '@sveltejs/kit';
import { and, eq, exists, sql } from 'drizzle-orm';

import { Actions } from '.';

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

export function withPermissions<TEvent extends RequestEvent, TResult>(
	handler: (user: App.User, actions: App.Actions, event: TEvent) => TResult
) {
	return async (event: TEvent): Promise<Awaited<TResult>> => {
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
