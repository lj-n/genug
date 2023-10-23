import { db, withAuth } from '$lib/server';
import type { PageServerLoad } from './$types';

const getUserTransactions = (userId: string) => {
	return db.query.userTransaction.findMany({
		where: (userTransaction, { eq }) => eq(userTransaction.userId, userId),
		with: {
			category: true,
			account: true
		}
	});
};

export const load: PageServerLoad = withAuth((_, user) => {
	return { transactions: getUserTransactions(user.userId) };
});