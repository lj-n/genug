import type { TransactionFilterParam, TransactionSortParam } from '$db/actions/queries/transaction';

import { withPermissions } from '$db/actions';
import { error } from '@sveltejs/kit';
import z from 'zod';

import type { PageServerLoad } from './$types';

function parseURLSearchParams(params: URLSearchParams) {
	const sortParam = z.enum(['asc', 'desc']).optional().catch(undefined);

	return z
		.object({
			categoryId: z.string().array().optional().catch([]),
			page: z.coerce.number().min(1).default(1).catch(1),
			pageSize: z.coerce.number().min(15).default(15).catch(15),
			sortAccount: sortParam,
			sortCategory: sortParam,
			sortDate: sortParam,
			sortValidated: sortParam
		})
		.parse(Object.fromEntries(params.entries()));
}

export const load: PageServerLoad = withPermissions(async (user, actions, event) => {
	const { budget } = await event.parent();

	const account = budget.accounts.find((account) => account.id === event.params.accountId);

	if (!account) {
		error(404, 'Account not found');
	}

	const params = parseURLSearchParams(event.url.searchParams);

	const filter: TransactionFilterParam = {
		accountId: account.id,
		...(params.categoryId ? { categoryId: params.categoryId } : {})
	};

	const sort: TransactionSortParam = {
		...(params.sortCategory ? { category: params.sortCategory } : {}),
		...(params.sortAccount ? { account: params.sortAccount } : {}),
		...(params.sortDate ? { date: params.sortDate } : {}),
		...(params.sortValidated ? { validated: params.sortValidated } : {})
	};

	const { transactions } = actions.transaction.list({
		filter,
		pagination: {
			page: params.page - 1, // API is 0-indexed, UI is 1-indexed
			pageSize: params.pageSize
		},
		sort
	});

	const totalTransactionCount = actions.transaction.list({ filter }).transactions.length;
	const pagination = {
		page: params.page,
		pageSize: params.pageSize,
		pageTotalCount: totalTransactionCount
	};

	return { account, pagination, totalTransactionCount, transactions };
});
