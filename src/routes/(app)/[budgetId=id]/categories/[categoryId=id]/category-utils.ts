type Category = {
	pendingTransactionCount: number;
	totalAssignedBudgetSum: number;
	totalRelatedTransactionSum: number;
};

export function hasNoPendingTransactions(category: Category): boolean {
	return category.pendingTransactionCount === 0;
}

export function hasNoRemainingBudget(category: Category): boolean {
	return category.totalAssignedBudgetSum + category.totalRelatedTransactionSum === 0;
}

export function isArchivable(category: Category): boolean {
	return hasNoRemainingBudget(category) && hasNoPendingTransactions(category);
}
