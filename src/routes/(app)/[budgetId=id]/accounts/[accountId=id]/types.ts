import type { PageData } from './$types';

export type PaginationState = {
	page: number;
	pageSize: number;
	pageTotalCount: number;
};

export type TransactionRow = PageData['transactions'][number];
