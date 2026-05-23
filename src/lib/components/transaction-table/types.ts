import type { transactions } from '$db/tables/transactions';

export type AccountBalances = { balance: number; pending: number; validated: number };

export type CategoryItem = { id: string; name: string };

export type PaginationState = {
	page: number;
	pageSize: number;
	totalTransactionCount: number;
};

export type TransactionEditFieldName =
	| 'accountId'
	| 'amount'
	| 'categoryId'
	| 'date'
	| 'notes'
	| 'transactionId'
	| 'validated';

export type TransactionRow = typeof transactions.$inferSelect & {
	categoryName: null | string;
};
