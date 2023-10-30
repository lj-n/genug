import { useUserAccount } from './user.account';
import { useUserBudget } from './user.budget';
import { useUserCategory } from './user.category';
import { useUserTeam } from './user.team';
import { useUserTransaction } from './user.transaction';

export * from './user.account';
export * from './user.auth';
export * from './user.category';
export * from './user.transaction';
export * from './user.budget';

export const userClient = (userId: string) => {
	return {
    id: userId,
		account: useUserAccount(userId),
		category: useUserCategory(userId),
		budget: useUserBudget(userId),
		transaction: useUserTransaction(userId),
		team: useUserTeam(userId)
	};
};
