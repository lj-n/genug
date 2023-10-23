import { db, withAuth } from '$lib/server';
import type { PageServerLoad } from './$types';

const getUserTransactions = (userId: string) => {
	return db.query.userTransaction.findMany({
    columns: {
      categoryId: false,
      accountId: false,
      userId: false,
    },
		where: (userTransaction, { eq }) => eq(userTransaction.userId, userId),
		with: {
			category: {
        columns: {
          userId: false
        }
      },
			account: {
        columns: {
          userId: false
        }
      },
		}
	});
};

export const load: PageServerLoad = withAuth((_, user) => {
	return { transactions: getUserTransactions(user.userId) };
});