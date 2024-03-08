import { useTeamAccount } from './team.account';
import { useTeamAuth } from './team.auth';
import { useTeamBudget } from './team.budget';
import { useTeamCategory } from './team.category';
import { useTeamTransaction } from './team.transaction';

export * from './team.account';
export * from './team.auth';
export * from './team.budget';
export * from './team.category';
export * from './team.transaction';

export const teamClient = (teamId: number, userId: string) => {
	const auth = useTeamAuth(teamId, userId);

	try {
		auth.getRole();
	} catch (error) {
		console.log('🛸 < TeamClient < error =', error);
		return null;
	}

	return {
		category: useTeamCategory(teamId),
		account: useTeamAccount(teamId),
		budget: useTeamBudget(teamId),
		transaction: useTeamTransaction(teamId),
		auth
	};
};
