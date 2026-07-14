export type TransactionDateGroup<T extends { date: string }> = {
	date: string;
	transactions: T[];
};

/**
 * Groups transactions by their (ISO `yyyy-mm-dd`) date, newest group first.
 * Input order is preserved within a group. Used by the mobile register list
 * (ADR-0014), which shows date group headers instead of a date column.
 */
export function groupTransactionsByDate<T extends { date: string }>(
	transactions: T[]
): TransactionDateGroup<T>[] {
	const byDate = new Map<string, T[]>();
	for (const transaction of transactions) {
		const group = byDate.get(transaction.date);
		if (group) group.push(transaction);
		else byDate.set(transaction.date, [transaction]);
	}
	// ISO date strings sort correctly as plain strings.
	return [...byDate.entries()]
		.sort(([a], [b]) => b.localeCompare(a))
		.map(([date, grouped]) => ({ date, transactions: grouped }));
}
