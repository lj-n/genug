import type {
	TransactionFilterParam,
	TransactionSortParam
} from '$lib/server/db/user-context/transaction';

import { ListTransactionsSchema } from '$lib/schemas/transaction';
import { guardedQuery } from '$server/utils/remote-guard';
import * as v from 'valibot';

// The reads that every change to an account's register makes stale (see
// `registerQueries`). Kept apart from the mutations so the shared refresh
// fan-out can import them without an import cycle.

export const listTransactions = guardedQuery(
	ListTransactionsSchema,
	async (
		{
			accountId,
			categoryId,
			notes,
			page,
			pageSize,
			showSealed,
			sortAccount,
			sortAmount,
			sortCategory,
			sortDate,
			sortValidated
		},
		{ ctx }
	) => {
		const filter: TransactionFilterParam = {
			accountId,
			...(categoryId?.length ? { categoryId } : {}),
			...(notes ? { notes } : {}),
			hideSealed: !showSealed
		};

		const sort: TransactionSortParam = {
			...(sortCategory ? { category: sortCategory } : {}),
			...(sortAccount ? { account: sortAccount } : {}),
			...(sortDate ? { date: sortDate } : {}),
			...(sortAmount ? { amount: sortAmount } : {}),
			...(sortValidated ? { validated: sortValidated } : {})
		};

		const { hiddenCount, rows, sealedCount, total } = ctx.transaction.page(filter, sort, {
			page: page - 1,
			pageSize
		});

		return {
			pagination: { page, pageSize, totalTransactionCount: total },
			sealed: { count: sealedCount, hidden: hiddenCount },
			transactions: rows
		};
	}
);

/** The account page's view of Checkpoints for the viewing user. */
export const getCheckpointSummary = guardedQuery(v.string(), async (accountId, { ctx }) =>
	ctx.checkpoint.summary(accountId)
);
