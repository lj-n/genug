import { and, eq, ne, or, sql } from 'drizzle-orm';
import type { Database } from './db';
import { schema } from './schema';
import { getTeamRole } from './teams';

/** Retrieves the accounts with their balances for a given user. */
export function getAccountsWithBalance(
	database: Database,
	userId: string
): Array<
	Omit<typeof schema.account.$inferSelect, 'userId' | 'teamId'> & {
		team: typeof schema.team.$inferSelect | null;
	} & {
		/** The sum of all transactions associated with this account. */
		count: number;
		/** The sum of all __validated__ transactions associated with this account. */
		validated: number;
		/** The sum of all __unvalidated__ transactions associated with this account. */
		pending: number;
		/** The combined sum of validated and unvalidated transaction associated with this account. */
		working: number;
	}
> {
	return database
		.select({
			id: schema.account.id,
			name: schema.account.name,
			description: schema.account.description,
			createdAt: schema.account.createdAt,
			team: schema.team,
			count: sql<number>`coalesce(count(${schema.transaction.flow}), 0)`,
			validated: sql<number>`coalesce(sum(CASE WHEN ${schema.transaction.validated} = 1 THEN ${schema.transaction.flow} ELSE 0 END) ,0)`,
			pending: sql<number>`coalesce(sum(CASE WHEN ${schema.transaction.validated} = 0 THEN ${schema.transaction.flow} ELSE 0 END) ,0)`
		})
		.from(schema.account)
		.leftJoin(
			schema.transaction,
			eq(schema.transaction.accountId, schema.account.id)
		)
		.leftJoin(
			schema.teamMember,
			eq(schema.teamMember.teamId, schema.account.teamId)
		)
		.leftJoin(schema.team, eq(schema.team.id, schema.account.teamId))
		.where(
			or(
				eq(schema.account.userId, userId),
				and(
					eq(schema.teamMember.userId, userId),
					ne(schema.teamMember.role, 'INVITED')
				)
			)
		)
		.groupBy(({ id }) => id)
		.all()
		.map(({ validated, pending, ...rest }) => ({
			validated,
			pending,
			working: validated + pending,
			...rest
		}));
}

/**
 * @throws Error if the account is not found or if the user is not the owner of the team the account belongs to.
 */
export function updateAccount(
	database: Database,
	userId: string,
	accountId: number,
	update: Partial<
		Pick<typeof schema.account.$inferSelect, 'name' | 'description'>
	>
): typeof schema.account.$inferSelect {
	return database.transaction(() => {
		const account = getAccount(database, userId, accountId);

		if (!account) {
			throw new Error('Account not found');
		}

		if (
			account.teamId &&
			getTeamRole(database, account.teamId, userId) !== 'OWNER'
		) {
			throw new Error('Must be team owner');
		}

		return database
			.update(schema.account)
			.set(update)
			.where(eq(schema.account.id, accountId))
			.returning()
			.get();
	});
}

export function getAccounts(
	database: Database,
	userId: string
): Array<
	Omit<typeof schema.account.$inferSelect, 'userId' | 'teamId'> & {
		team: typeof schema.team.$inferSelect | null;
	}
> {
	return database
		.select({
			id: schema.account.id,
			name: schema.account.name,
			description: schema.account.description,
			createdAt: schema.account.createdAt,
			team: schema.team
		})
		.from(schema.account)
		.leftJoin(
			schema.teamMember,
			eq(schema.teamMember.teamId, schema.account.teamId)
		)
		.leftJoin(schema.team, eq(schema.team.id, schema.account.teamId))
		.where(
			or(
				eq(schema.account.userId, userId),
				and(
					eq(schema.teamMember.userId, userId),
					ne(schema.teamMember.role, 'INVITED')
				)
			)
		)
		.all();
}

export function getAccount(
	database: Database,
	userId: string,
	accountId: number
): typeof schema.account.$inferSelect | null {
	const found = database
		.select({ account: schema.account })
		.from(schema.account)
		.leftJoin(
			schema.teamMember,
			eq(schema.teamMember.teamId, schema.account.teamId)
		)
		.where(
			and(
				eq(schema.account.id, accountId),
				or(
					eq(schema.account.userId, userId),
					and(
						eq(schema.teamMember.userId, userId),
						ne(schema.teamMember.role, 'INVITED')
					)
				)
			)
		)
		.get();

	return found?.account ?? null;
}
