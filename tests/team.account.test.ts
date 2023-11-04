import { beforeAll, describe, expect, test } from 'vitest';
import {
	createTeam,
	removeTeam,
	useTeamAccount,
	useTeamTransaction
} from '$lib/server/team';

const testUserId = 'qh1jpx6731v8w7v';

let teamId: number;

beforeAll(() => {
	const team = createTeam({ userId: testUserId, teamname: 'Test Team' });
	teamId = team.id;

	return () => {
		removeTeam(teamId);
	};
});

describe('user accounts', () => {
	let accountId: number;

	test('create account', () => {
		const name = 'Testaccount';
		const description = 'Testaccount description';

		const teamAccount = useTeamAccount(teamId);

		const account = teamAccount.create({
			name,
			description,
			createdBy: testUserId
		});
		accountId = account.id;

		expect(account.name).toBe(name);
		expect(account.description).toBe(description);
		expect(account.teamId).toBe(teamId);
		expect(account.createdBy).toBe(testUserId);
	});

	test('get account', () => {
		const teamAccount = useTeamAccount(teamId);

		const account = teamAccount.get(accountId);
		const accountWithTransactions = teamAccount.getWithTransactions(accountId);
		const accounts = teamAccount.getAll();
		const accountsWithTransactions = teamAccount.getAllWithTransactions();

		expect(account).toBeDefined();
		expect(accountWithTransactions).toHaveProperty('transactions', []);
		expect(accounts).toHaveLength(1);
		expect(accountsWithTransactions[0]).toHaveProperty('transactions', []);
	});

	test('update account', () => {
		const teamAccount = useTeamAccount(teamId);

		const account = teamAccount.update(accountId, { name: 'New Name' });
		expect(account.name).toBe('New Name');
		expect(teamAccount.get(accountId).name).toBe('New Name');
	});

	test('aggregate account balances', () => {
		const teamAccount = useTeamAccount(teamId);
		const teamTransaction = useTeamTransaction(teamId);

		teamTransaction.create({
			accountId,
			flow: 400,
			validated: true,
			createdBy: testUserId
		});
		teamTransaction.create({
			accountId,
			flow: -800,
			validated: true,
			createdBy: testUserId
		});
		teamTransaction.create({
			accountId,
			flow: -200,
			validated: false,
			createdBy: testUserId
		});
		teamTransaction.create({
			accountId,
			flow: 1000,
			validated: false,
			createdBy: testUserId
		});

		const balance = teamAccount.getBalance(accountId);
		const balances = teamAccount.getBalances();

		expect(balance.validated).toBe(-400);
		expect(balance.pending).toBe(800);
		expect(balances).toMatchObject([
			{
				...teamAccount.get(accountId),
				validated: -400,
				pending: 800
			}
		]);
	});

	test('remove account', () => {
		const teamAccount = useTeamAccount(teamId);
		const removedAccount = teamAccount.remove(accountId);

		expect(removedAccount).toBeDefined();
		expect(() => teamAccount.get(accountId)).toThrowError(
			`Team(${teamId}) account(${accountId}) not found`
		);
	});
});
