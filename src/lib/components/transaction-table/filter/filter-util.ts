import type { TransactionFilterParam } from '$db/transaction';

export function getFilterLength(filter: TransactionFilterParam) {
	const { categoryId, fromDate, maxAmount, minAmount, notes, toDate, validated } = filter;

	let length = 0;

	if (categoryId) length += Array.isArray(categoryId) ? categoryId.length : 1;
	if (notes) length += 1;
	if (validated) length += 1;
	if (toDate || fromDate) length += 1;
	if (minAmount || maxAmount) length += 1;

	return length;
}
