import type {
	TransactionFilterParam,
	TransactionPaginationParam,
	TransactionSortParam
} from '$db/actions/queries/transaction';

import { withPermissions } from '$db/actions';
import { schemaURLParams } from '$lib/components/transaction-table/schema';
import { schemaTransactionCreate, schemaTransactionEdit } from '$lib/schemas/transactions';
import { getLocalTimeZone, today } from '@internationalized/date';
import { error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import type { PageServerLoad, PageServerLoadEvent } from './$types';

async function loadForms() {
	const [transactionEdit, transactionCreate] = await Promise.all([
		superValidate(zod4(schemaTransactionEdit)),
		superValidate({ date: today(getLocalTimeZone()).toString() }, zod4(schemaTransactionCreate), {
			errors: false
		})
	]);

	return { transactionCreate, transactionEdit };
}

export const load: PageServerLoad = withPermissions(
	async (user, actions, event: PageServerLoadEvent) => {
		const { accountId } = event.params;
		const { searchParams } = event.url;

		const { budget } = await event.parent();

		const account = actions.account.getById({ id: accountId });
		if (!account) error(404, 'Account not found');

		const params = schemaURLParams.parse({
			categoryId: searchParams.getAll('categoryId'),
			notes: searchParams.get('notes'),
			page: searchParams.get('page'),
			pageSize: searchParams.get('pageSize')
		});

		const filter: TransactionFilterParam = {
			accountId: account.id,
			...(params.categoryId?.length ? { categoryId: params.categoryId } : {}),
			...(params.notes ? { notes: params.notes } : {})
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
		const pagination: TransactionPaginationParam = {
			page: params.page,
			pageSize: params.pageSize,
			totalTransactionCount
		};

		const categories = actions.category
			.allFlat({ budgetId: budget.id })
			.filter((cat) => cat.archivedAt === null);

		const balanceDetail = actions.account.getBalanceDetail({ accountId: account.id });

		return {
			account,
			balances: {
				balance: account.balance,
				...balanceDetail
			},
			categories,
			filter,
			forms: await loadForms(),
			pagination,
			totalTransactionCount,
			transactions
		};
	}
);
