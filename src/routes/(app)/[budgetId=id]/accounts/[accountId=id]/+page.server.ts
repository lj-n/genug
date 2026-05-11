import type { TransactionFilterParam, TransactionSortParam } from '$db/actions/queries/transaction';

import { withPermissions } from '$db/actions';
import { getLocalTimeZone, today } from '@internationalized/date';
import { error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { PageServerLoad } from './$types';

import { schemaTransactionCreate } from '../../transactions/new/schema';
import { schemaTransactionEdit } from '../../transactions/schema';
import { schemaURLParams } from './schema';

export const load: PageServerLoad = withPermissions(async (user, actions, event) => {
	const { budget } = await event.parent();

	const account = budget.accounts.find((account) => account.id === event.params.accountId);

	if (!account) {
		error(404, 'Account not found');
	}

	const params = schemaURLParams.parse(Object.fromEntries(event.url.searchParams.entries()));

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

	const categories = actions.category
		.allFlat({ budgetId: budget.id })
		.filter((cat) => cat.archivedAt === null);

	const formTransactionEdit = await superValidate(zod4(schemaTransactionEdit));
	const formTransactionCreate = await superValidate(
		{ date: today(getLocalTimeZone()).toString() },
		zod4(schemaTransactionCreate),
		{ errors: false }
	);

	return {
		account,
		categories,
		formTransactionCreate,
		formTransactionEdit,
		pagination,
		totalTransactionCount,
		transactions
	};
});
