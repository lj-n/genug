import type { PageData } from './$types';

export function hasNoPendingTransactions(category: PageData['category']): boolean {
	return category.pendingTransactionCount === 0;
}

export function hasNoRemainingBudget(category: PageData['category']): boolean {
	return category.totalAssignedBudgetSum + category.totalRelatedTransactionSum === 0;
}

export function isArchivable(category: PageData['category']): boolean {
	return hasNoRemainingBudget(category) && hasNoPendingTransactions(category);
}
