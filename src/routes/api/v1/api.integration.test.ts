/**
 * End-to-end wiring for the native API (ticket #195): a real PAT is issued and
 * validated exactly as `hooks.server.ts` does, then fed to the `+server.ts`
 * handlers to prove the Bearer path reaches `user-context` and serialises a
 * contract response. The per-endpoint response shapes are covered against the
 * published schemas in `src/lib/server/api/endpoints.test.ts`; this asserts the
 * glue — auth, params, status codes, and the JSON body.
 */

import type { RequestEvent, RequestHandler } from '@sveltejs/kit';

import { database, tables } from '$db';
import { createApiToken, validateApiToken } from '$db/auth/api-tokens';
import { beforeAll, describe, expect, it } from 'vitest';

import { GET as getBudgets } from './budgets/+server';
import { POST as postTransactions } from './transactions/+server';

async function call(
	handler: RequestHandler,
	request: Request,
	user: NonNullable<App.Locals['user']> | null
) {
	const event = {
		locals: { user },
		params: {},
		request,
		url: new URL(request.url)
	} as unknown as RequestEvent;
	return handler(event);
}

let user: NonNullable<App.Locals['user']>;
let budgetId: string;
let accountId: string;

beforeAll(async () => {
	const seededUser = database
		.insert(tables.users)
		.values({ passwordHash: 'hash', username: 'api-integration' })
		.returning()
		.get();
	const budget = database.insert(tables.budgets).values({ name: 'Wallet' }).returning().get();
	database
		.insert(tables.usersToBudgets)
		.values({ budgetId: budget.id, role: 'OWNER', userId: seededUser.id })
		.run();
	const account = database
		.insert(tables.accounts)
		.values({ budgetId: budget.id, name: 'Checking' })
		.returning()
		.get();

	budgetId = budget.id;
	accountId = account.id;

	const { token } = createApiToken({ db: database, name: 'ios', userId: seededUser.id });
	const validated = await validateApiToken({ db: database, token });
	expect(validated?.id).toBe(seededUser.id);
	user = validated!;
});

describe('native API routes over the Bearer path', () => {
	it('GET /budgets returns 401 without a token', async () => {
		const response = await call(getBudgets, new Request('http://localhost/api/v1/budgets'), null);
		expect(response.status).toBe(401);
	});

	it('GET /budgets lists the token user’s budgets', async () => {
		const response = await call(getBudgets, new Request('http://localhost/api/v1/budgets'), user);
		expect(response.status).toBe(200);
		const budgets = (await response.json()) as { id: string; name: string }[];
		expect(budgets.map((b) => b.id)).toContain(budgetId);
	});

	it('POST /transactions?month= captures and returns the fat write result', async () => {
		const request = new Request('http://localhost/api/v1/transactions?month=202501', {
			body: JSON.stringify({ accountId, amount: 100000, budgetId }),
			headers: { 'content-type': 'application/json' },
			method: 'POST'
		});
		const response = await call(postTransactions, request, user);
		expect(response.status).toBe(201);
		const result = (await response.json()) as {
			accounts: { accountId: string; balance: number }[];
			transaction: { amount: number; categoryId: null | string };
		};
		expect(result.transaction.amount).toBe(100000);
		expect(result.accounts).toEqual([{ accountId, balance: 100000 }]);
	});

	it('POST /transactions rejects a malformed month with 400', async () => {
		const request = new Request('http://localhost/api/v1/transactions?month=nope', {
			body: JSON.stringify({ accountId, amount: 100, budgetId }),
			headers: { 'content-type': 'application/json' },
			method: 'POST'
		});
		const response = await call(postTransactions, request, user);
		expect(response.status).toBe(400);
	});
});
